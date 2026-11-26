import express from "express";
import db from "../config/database.js";
import path from "node:path";
import fs from "node:fs/promises";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import upload from "../middleware/upload.js";
import {
  MAX_MB, MAX_FILES, MAX_TOTAL_SIZE, MAX_TOTAL_MB
} from "../config/uploadConfig.js";

const router = express.Router();
const STORAGE_ROOT = path.resolve(process.cwd(), "data", "uploaded_file");
const allowedExt = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx"]);

function checkAuth(req, res, next) {
  if (req.session?.userId) return next();
  return res.redirect("/login");
}

function isAlreadyLoggedIn(req, res, next) {
  if (req.session?.userId) return res.redirect("/");
  next();
}

function text(value, max = 255) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeOriginalName(name) {
  return path.basename(String(name || "document"))
    .replace(/[\/\\]/g, "_")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .slice(0, 255) || "document";
}

function displayNameFromFile(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[_-]+/g, " ")
    .trim();
}

function parseArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function ensureArray(value) {
  return Array.isArray(value) ? value : (value == null ? [] : [value]);
}

function validateUploadBatch(files) {
  if (!files?.length) throw new Error("Pilih setidaknya satu dokumen.");
  if (files.length > MAX_FILES) throw new Error(`Maksimal ${MAX_FILES} dokumen dalam satu proses.`);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_SIZE) throw new Error(`Total ukuran dokumen maksimal ${MAX_TOTAL_MB} MB.`);
  for (const file of files) {
    if (!allowedExt.has(path.extname(file.originalname || "").toLowerCase())) {
      throw new Error("Ada file dengan format yang tidak didukung.");
    }
  }
}

async function writeUploadedFile(file, folderPath) {
  const originalName = safeOriginalName(file.originalname);
  const ext = path.extname(originalName).toLowerCase();
  const storedFilename = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(folderPath, storedFilename), file.buffer, { flag: "wx" });
  return {
    document_name: "",
    original_filename: originalName,
    stored_filename: storedFilename,
    mime_type: file.mimetype,
    file_size: file.size
  };
}

async function insertDocument(client, integrationId, metadata, documentName) {
  await client.query(
    `INSERT INTO uploaded_documents
      (upload_document_id, document_name, original_filename, stored_filename, mime_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      integrationId,
      text(documentName, 255) || displayNameFromFile(metadata.original_filename),
      metadata.original_filename,
      metadata.stored_filename,
      metadata.mime_type,
      metadata.file_size
    ]
  );
}

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/[&<>"']/g, function (char) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[char];
  });
}

async function getIntegration(id) {
  const result = await db.query(
    "SELECT * FROM upload_document WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

function flashError(req, res, message, url) {
  req.flash("error", message);
  return res.redirect(url);
}

router.get("/", checkAuth, async (req, res) => {
    try {
        const result = await db.query(` SELECT i.*, COUNT(d.id)::int AS uploaded_count, COALESCE(SUM(d.file_size), 0)::bigint AS total_file_size FROM upload_document i LEFT JOIN uploaded_documents d ON d.upload_document_id = i.id GROUP BY i.id ORDER BY i.id DESC `);
        const integrations = result.rows;

        let tableRows = "";

        if (integrations.length === 0) {
            tableRows = `<tr>
                             <td colspan="8" class="p-0 bg-white">
                                 <div class="row no-gutters p-4 text-center bg-white text-muted justify-content-center">
                                     No integration data available.
                                 </div>
                             </td>
                         </tr>`;
        } else {
            for (let i = 0; i < integrations.length; i++) {
                const item = integrations[i];

                const sizeMB = (
                    Number(item.total_file_size || 0) /
                    (1024 * 1024)
                ).toFixed(2);

                let createdAt = "-";

                if (item.created_at) {
                    createdAt = new Date(item.created_at).toLocaleString(
                        "id-ID", { timeZone: "Asia/Jakarta" }
                    );
                }

                let updatedAt = "-";

                if (item.updated_at) {
                    updatedAt = new Date(item.updated_at).toLocaleString(
                        "id-ID", { timeZone: "Asia/Jakarta" }
                    );
                }

                tableRows += `<tr class="align-middle">
                                  <td class="pl-4 align-middle" style="width: 90px;">
                                      <div class="d-flex align-items-center justify-content-start">
                                          <div style="width: 32px;" class="text-left d-flex align-items-center">
                                              <input
                                                  class="form-check-input check"
                                                  type="checkbox"
                                                  id="check_${item.id}"
                                                  value="${item.id}"
                                                  data-name="${escapeHTML(item.name)}"
                                                  style="position: static; margin: 0; flex-shrink: 0;"
                                              >
                                          </div>

                                          <span class="font-weight-bold text-muted pl-1">
                                              ${i + 1}
                                          </span>
                                      </div>
                                  </td>

                                  <td class="font-weight-bold">
                                      ${escapeHTML(item.name)}
                                  </td>

                                  <td>
                                      ${escapeHTML(item.api_name)} ${escapeHTML(item.va_type || "")}
                                  </td>

                                  <td>${escapeHTML(createdAt)}</td>
                                  <td>${escapeHTML(updatedAt)}</td>

                                  <td class="text-center">
                                      <span class="badge badge-primary px-2 py-1">
                                          ${Number(item.uploaded_count || 0)}
                                      </span>
                                  </td>

                                  <td class="text-center">
                                      ${sizeMB} MB
                                  </td>

                                  <td class="text-nowrap text-center pr-4">
                                      <a
                                          href="/read_data?id=${encodeURIComponent(item.id)}"
                                          class="btn btn-sm btn-outline-primary mr-1"
                                      >
                                          View
                                      </a>
                                  </td>
                              </tr>`;
            }
        }

        const successMessage = req.flash("success")[0] || "";
        const errorMessage = req.flash("error")[0] || "";

        return res.render("index.ejs", {
            tableRows: tableRows,
            successMessage: successMessage,
            errorMessage: errorMessage
        });

    } catch (err) {
        console.error("GET / error:", err);
        return res.status(500).send(
            "Gagal mengambil data integrasi."
        );
    }
});


router.get("/upload", checkAuth, (req, res) => {
    res.render("upload.ejs", {
        maxMB: MAX_MB,
        maxFiles: MAX_FILES,
        maxTotalMB: MAX_TOTAL_MB,
        successMessage: req.flash("success")[0] || "",
        errorMessage: req.flash("error")[0] || ""
    });
});

router.post(
    "/upload",
    checkAuth,
    upload.array("documents", MAX_FILES),
    async (req, res) => {
        const folderName = `integration-${randomUUID()}`;
        const folderPath = path.join(STORAGE_ROOT, folderName);

        let client;
        let folderCreated = false;
        let transactionStarted = false;

        try {
            const files = req.files || [];

            validateUploadBatch(files);

            const institution = text(req.body.institutionName, 256);
            const apiName = text(req.body.integrationType, 128);

            const documentNames = ensureArray(
                req.body.documentNames
            ).map(name => text(name, 255));

            if (!institution || !apiName) {
                throw new Error(
                    "Nama mitra (Partner Name) dan API Name wajib diisi."
                );
            }

            if (files.length === 0) {
                throw new Error(
                    "Silakan pilih minimal 1 dokumen untuk diunggah."
                );
            }

            if (documentNames.length !== files.length) {
                throw new Error(
                    "Jumlah nama dokumen tidak sesuai dengan berkas yang dipilih."
                );
            }

            const lowerCaseNames = [];

            for (const docName of documentNames) {
                if (!docName) {
                    throw new Error(
                        "Nama dokumen tidak boleh kosong."
                    );
                }

                lowerCaseNames.push(docName.toLowerCase());
            }

            if (
                new Set(lowerCaseNames).size !==
                lowerCaseNames.length
            ) {
                throw new Error(
                    "Nama dokumen di dalam daftar tidak boleh ada yang sama."
                );
            }

            await fs.mkdir(folderPath, {
                recursive: true
            });

            folderCreated = true;

            client = await db.connect();

            // Mulai transaksi database
            await client.query("BEGIN");
            transactionStarted = true;

            // Simpan data integrasi
            const integrationResult = await client.query(
                `INSERT INTO upload_document
                    (name, api_name, folder_name, created_at, updated_at)
                VALUES
                    ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id`,
                [institution, apiName, folderName]
            );

            const integrationId = integrationResult.rows[0].id;

            for (let i = 0; i < files.length; i++) {
                const metadata = await writeUploadedFile(
                    files[i],
                    folderPath
                );

                await insertDocument(
                    client,
                    integrationId,
                    metadata,
                    documentNames[i]
                );
            }

            await client.query("COMMIT");
            transactionStarted = false;

            const successMessage =
                `Data integrasi berhasil ditambahkan. ${files.length} dokumen berhasil diunggah.`;

            req.flash("success", successMessage);

            if (
                req.get("X-Requested-With") === "XMLHttpRequest"
            ) {
                return req.session.save(function (err) {
                    if (err) {
                        console.error(
                            "Gagal menyimpan session:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Data berhasil disimpan, tetapi notifikasi gagal disimpan."
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        redirectUrl: "/"
                    });
                });
            }

            return res.redirect("/");

        } catch (err) {
            console.error("POST /upload error:", err);
            if (client && transactionStarted) {
                await client.query("ROLLBACK").catch(rollbackError => {
                    console.error(
                        "Gagal melakukan rollback:",
                        rollbackError
                    );
                });

                transactionStarted = false;
            }

            if (folderCreated) {
                await fs.rm(folderPath, {
                    recursive: true,
                    force: true
                }).catch(cleanupError => {
                    console.error(
                        "Gagal membersihkan folder upload:",
                        cleanupError
                    );
                });
            }

            const errorMessage =
                err.message || "Gagal menyimpan dokumen.";

            if (
                req.get("X-Requested-With") === "XMLHttpRequest"
            ) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return flashError(
                req,
                res,
                errorMessage,
                "/upload"
            );

        } finally {
            if (client) {
                client.release();
            }
        }
    }
);


router.get("/read_data", checkAuth, async (req, res) => {
  try {
    const id = Number(req.query.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send("ID integrasi tidak valid.");
    }

    const integration = await getIntegration(id);

    if (!integration) {
      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    const itemsPerPage = 10;
    let currentPage = Number(req.query.page);

    if (!Number.isInteger(currentPage) || currentPage < 1) {
      currentPage = 1;
    }

    const summaryResult = await db.query( `SELECT COUNT(*)::int AS total_documents, COALESCE(SUM(file_size), 0)::bigint AS total_file_size FROM uploaded_documents WHERE upload_document_id = $1`, [id] );

    const totalDocuments = Number(summaryResult.rows[0].total_documents);
    const totalSize = (
      Number(summaryResult.rows[0].total_file_size) /
      (1024 * 1024)
    ).toFixed(2);

    let totalPages = Math.ceil(totalDocuments / itemsPerPage);

    if (totalPages < 1) {
      totalPages = 1;
    }

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const offset = (currentPage - 1) * itemsPerPage;

    const docs = await db.query( `SELECT id, document_name, original_filename, mime_type, file_size, created_at FROM uploaded_documents WHERE upload_document_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3`, [id, itemsPerPage, offset] );

    let documentsHTML = "";

    if (docs.rows.length === 0) {
      documentsHTML = `
        <div class="text-muted text-center py-4">
          Belum ada dokumen.
        </div>
      `;
    } else {
      for (let i = 0; i < docs.rows.length; i++) {
        const doc = docs.rows[i];

        const documentNumber = offset + i + 1;
        const fileSize = (
          Number(doc.file_size) /
          (1024 * 1024)
        ).toFixed(2);

        let rowClass = "";

        if (i !== docs.rows.length) {
          rowClass = "border-bottom pb-3 mb-3";
        }

        documentsHTML += `<div class="main-doc-item d-flex flex-wrap justify-content-between align-items-start ${rowClass}">
                            <div class="d-flex pr-3">
                              <div class="font-weight-bold text-muted mr-3" style="min-width: 25px;" >
                                ${documentNumber}.
                              </div>
                              <div>
                                <div class="font-weight-bold">
                                  ${escapeHTML(doc.document_name)}
                                </div>
                                <small class="text-muted">
                                  ${escapeHTML(doc.original_filename)}
                                  ·
                                  ${fileSize} MB
                                </small>
                              </div>
                            </div>
                            <div class="pt-1">
                              <a class="btn btn-sm btn-outline-primary" href="/view_file?documentId=${encodeURIComponent(doc.id)}" > View </a>
                            </div>
                          </div>
                        `;
      }
    }

    let paginationHTML = "";

    if (totalPages > 1) {
      paginationHTML += `<nav class="mt-4" aria-label="Document pagination">
                           <ul class="pagination pagination-sm justify-content-left mb-0">`;

      let previousClass = "";

      if (currentPage === 1) {
        previousClass = "disabled";
      }

      paginationHTML += `<li class="page-item ${previousClass}">
                           <a class="page-link" href="/read_data?id=${id}&page=${currentPage - 1}" >
                              &laquo;
                           </a>
                         </li>`;

      for (let page = 1; page <= totalPages; page++) {
        let activeClass = "";

        if (page === currentPage) {
          activeClass = "active";
        }

        paginationHTML += `<li class="page-item ${activeClass}">
                             <a class="page-link" href="/read_data?id=${id}&page=${page}">
                                ${page}
                             </a>
                           </li>`;
      }

      let nextClass = "";

      if (currentPage === totalPages) {
        nextClass = "disabled";
      }

      paginationHTML += `<li class="page-item ${nextClass}">
                            <a class="page-link" href="/read_data?id=${id}&page=${currentPage + 1}" >
                              &raquo;
                            </a>
                         </li>`;

      paginationHTML += `
          </ul>
        </nav>
      `;
    }

    return res.render("read_data.ejs", {
        integration,
        totalDocuments,
        totalSize,
        documentsHTML,
        paginationHTML,
        successMessage: req.flash("success")[0] || "",
        errorMessage: req.flash("error")[0] || ""
    });
  } catch (err) {
    console.error("GET /read_data error:", err);
    return res.status(500).send("Gagal membaca data integrasi.");
  }
});


router.get("/view_file", checkAuth, async (req, res) => {
  try {
    const docId = Number(req.query.documentId);
    if (!Number.isInteger(docId) || docId <= 0) return res.status(400).send("ID dokumen tidak valid.");

    const result = await db.query(
      `SELECT d.*, i.folder_name
       FROM uploaded_documents d
       JOIN upload_document i ON i.id = d.upload_document_id
       WHERE d.id = $1`,
      [docId]
    );

    const doc = result.rows[0];
    if (!doc) return res.status(404).send("Dokumen tidak ditemukan.");

    const absolutePath = path.resolve(STORAGE_ROOT, doc.folder_name, doc.stored_filename);
    const relative = path.relative(STORAGE_ROOT, absolutePath);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      return res.status(403).send("Akses file ditolak.");
    }

    await fs.access(absolutePath);
    const ext = path.extname(doc.original_filename).toLowerCase();
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", doc.mime_type || "application/octet-stream");
    const disposition = ext === ".pdf" ? "inline" : "attachment";
    res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.original_filename)}`);
    return res.sendFile(absolutePath);
  } catch (err) {
    if (err.code === "ENOENT") return res.status(404).send("File fisik tidak ditemukan.");
    console.error("GET /view_file error:", err);
    res.status(500).send("Gagal membuka dokumen.");
  }
});

router.get("/update_data", checkAuth, async (req, res) => {
  try {
    const id = Number(req.query.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send("ID integrasi tidak valid.");
    }

    const integration = await getIntegration(id);

    if (!integration) {
      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    const result = await db.query(
      `SELECT
        id,
        document_name,
        original_filename,
        mime_type,
        file_size,
        created_at
       FROM uploaded_documents
       WHERE upload_document_id = $1
       ORDER BY id ASC`,
      [id]
    );

    const documents = result.rows;

    let documentsHTML = "";

    if (documents.length === 0) {
      documentsHTML = `
        <p class="text-muted text-center py-4">
          There are no documents yet.
        </p>
      `;
    } else {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];

        const fileSize = (Number(doc.file_size) / (1024 * 1024)).toFixed(2);

        documentsHTML += `<div class="doc-row main-doc-item">
                            <div class="d-flex align-items-start w-100">
                              <div class="font-weight-bold text-muted mr-3" style="font-size: 16px; min-width: 25px;" >
                                ${i + 1}.
                              </div>

                              <div class="flex-fill">
                                <div class="d-flex align-items-start w-100 mb-1">
                                  <div>
                                    <div class="font-weight-bold document-name" style="font-size: 16px;">
                                      ${escapeHTML(doc.document_name)}
                                    </div>
                                    <div class="small text-muted mb-1">
                                      ${escapeHTML(doc.original_filename)}
                                      · ${fileSize} MB
                                    </div>
                                  </div>

                                  <label class="text-danger small mb-0 font-weight-bold d-flex align-items-center ml-auto pt-1" style="cursor: pointer; user-select: none; flex-shrink: 0;" >
                                    <input type="checkbox" name="deleteDocumentIds" value="${encodeURIComponent(doc.id)}" class="delete-doc mr-1" style="cursor: pointer;" >
                                    Delete
                                  </label>
                                </div>

                                <a class="small font-weight-bold d-block mb-3" href="/view_file?documentId=${encodeURIComponent(doc.id)}" target="_blank" >
                                  View Document
                                </a>

                                <div class="w-100">
                                  <label class="small font-weight-bold mb-2 text-dark"> Replace (optional) </label>
                                  <div class="custom-file w-100">
                                    <input type="file" class="custom-file-input replacement-file" id="replace_${doc.id}" name="replacementFiles" data-id="${doc.id}" accept=".pdf,.doc,.docx,.xls,.xlsx" >
                                    <label class="custom-file-label small text-muted" for="replace_${doc.id}" style="border-color: #ced4da; background-color: #fff;" >
                                      Choose file or drag here...
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>`;
      }
    }

    let alertHTML = "";

    const message = req.flash("success")[0] || "";
    const errorMessage = req.flash("error")[0] || "";

    if (message) {
      alertHTML += `
        <div class="alert alert-success">
          ${escapeHTML(message)}
        </div>
      `;
    }

    if (errorMessage) {
      alertHTML += `
        <div class="alert alert-danger">
          ${escapeHTML(errorMessage)}
        </div>
      `;
    }

    return res.render("update_data.ejs", {
        integration,
        totalDocuments: documents.length,
        documentsHTML,
        successMessage: req.flash("success")[0] || "",
        errorMessage: req.flash("error")[0] || "",
        maxMB: MAX_MB,
        maxFiles: MAX_FILES,
        maxTotalMB: MAX_TOTAL_MB
    });
  } catch (err) {
    console.error("GET /update_data error:", err);
    return res.status(500).send("Gagal membuka halaman edit.");
  }
});


router.post("/update_data",checkAuth,upload.fields([
    { name: "newDocuments", maxCount: MAX_FILES },
    { name: "replacementFiles", maxCount: MAX_FILES }
  ]),
  async (req, res) => {
    const id = Number(req.query.id);
    const redirectUrl = `/update_data?id=${encodeURIComponent(id)}`;
    let client;
    let folderPath;
    const filesWritten = [];
    const filesToDelete = [];
    let deletedCount = 0;

    try {
      if (!Number.isInteger(id) || id <= 0) return res.status(400).send("ID integrasi tidak valid.");

      const integration = await getIntegration(id);
      if (!integration) return res.status(404).send("Data integrasi tidak ditemukan.");

      const newFiles = req.files?.newDocuments || [];
      const replacementFiles = req.files?.replacementFiles || [];
      const totalFiles = [...newFiles, ...replacementFiles];
      if (totalFiles.length > MAX_FILES) throw new Error(`Maksimal ${MAX_FILES} file dalam satu kali penyimpanan.`);
      if (totalFiles.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_SIZE) {
        throw new Error(`Total ukuran file maksimal ${MAX_TOTAL_MB} MB.`);
      }

      const institution = text(req.body.institutionName, 256);
      const apiName = text(req.body.integrationType, 128);
      if (!institution || !apiName) throw new Error("Nama mitra dan API Name wajib diisi.");

      const deleteIds = ensureArray(req.body.deleteDocumentIds)
        .map(Number);

      const replacementIds = ensureArray(
        req.body.replacementDocumentIds
      ).map(Number);

      const newNames = ensureArray(req.body.newDocumentNames)
        .map(name => text(name, 255));

      for (const docId of deleteIds) {
        if (!Number.isInteger(docId) || docId <= 0) {
          throw new Error("ID dokumen yang akan dihapus tidak valid.");
        }
      }

      for (const docId of replacementIds) {
        if (!Number.isInteger(docId) || docId <= 0) {
          throw new Error("ID dokumen pengganti tidak valid.");
        }
      }

      if (new Set(deleteIds).size !== deleteIds.length) {
        throw new Error("Terdapat ID dokumen penghapusan yang duplikat.");
      }

      if (new Set(replacementIds).size !== replacementIds.length) {
        throw new Error("Terdapat ID dokumen pengganti yang duplikat.");
      }

      for (const docId of replacementIds) {
        if (deleteIds.includes(docId)) {
          throw new Error(
            "Dokumen yang sama tidak bisa dihapus dan diganti sekaligus."
          );
        }
      }

      if (replacementIds.length !== replacementFiles.length) {
        throw new Error(
          "Jumlah ID dokumen pengganti tidak sesuai dengan jumlah file."
        );
      }

      if (newNames.length !== newFiles.length) {
        throw new Error(
          "Jumlah nama dokumen baru tidak sesuai dengan jumlah file."
        );
      }

      for (const name of newNames) {
        if (!name) {
          throw new Error("Nama dokumen baru tidak boleh kosong.");
        }
      }

      folderPath = path.join(STORAGE_ROOT, integration.folder_name);
      await fs.mkdir(folderPath, { recursive: true });

      client = await db.connect();
      await client.query("BEGIN");

      await client.query(
        `UPDATE upload_document
         SET name = $1, api_name = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [institution, apiName, id]
      );

      if (deleteIds.length > 0) {
          const deleted = await client.query(
              `DELETE FROM uploaded_documents
              WHERE upload_document_id = $1
              AND id = ANY($2::bigint[])
              RETURNING stored_filename`,
              [id, deleteIds]
          );

          deletedCount = deleted.rows.length;

          filesToDelete.push( ...deleted.rows.map(row => row.stored_filename) );
      }

      for (let i = 0; i < replacementFiles.length; i++) {
        const docId = Number(replacementIds[i]);
        if (!Number.isInteger(docId) || docId <= 0) throw new Error("ID dokumen pengganti tidak valid.");

        const old = await client.query( `SELECT stored_filename FROM uploaded_documents WHERE id = $1 AND upload_document_id = $2 FOR UPDATE`, [docId, id] );
        if (!old.rows[0]) throw new Error("Dokumen yang akan diganti tidak ditemukan.");

        const metadata = await writeUploadedFile(replacementFiles[i], folderPath);
        filesWritten.push(metadata.stored_filename);
        await client.query( `UPDATE uploaded_documents SET original_filename = $1, stored_filename = $2, mime_type = $3, file_size = $4, created_at = CURRENT_TIMESTAMP WHERE id = $5 AND upload_document_id = $6`, [metadata.original_filename, metadata.stored_filename, metadata.mime_type, metadata.file_size, docId, id] );
        filesToDelete.push(old.rows[0].stored_filename);
      }

      for (let i = 0; i < newFiles.length; i++) {
        const metadata = await writeUploadedFile(newFiles[i], folderPath);
        filesWritten.push(metadata.stored_filename);
        await insertDocument(client, id, metadata, newNames[i]);
      }

      await client.query("COMMIT");

      for (const filename of filesToDelete) {
        await fs.unlink(path.join(folderPath, filename)).catch(err => {
          if (err.code !== "ENOENT") console.error("Gagal membersihkan file lama:", err);
        });
      }

      let successMessage = "Perubahan dokumen berhasil disimpan.";
      if (deletedCount > 0) {
          successMessage = `${deletedCount} dokumen berhasil dihapus.`;
      }

      req.flash("success", successMessage);

      req.session.save(function (err) {
          if (err) {
              console.error("Gagal menyimpan session:", err);

              return res.status(500).json({
                  message: "Dokumen berhasil diproses, tetapi gagal menyimpan pesan notifikasi."
              });
          }

          return res.status(200).json({
              success: true,
              redirectUrl: `/read_data?id=${id}`
          });
      });
    } catch (err) {
      console.error("POST /update_data error:", err);
      const errorMessage = err.message || "Gagal memperbarui dokumen.";

      if (req.get("X-Requested-With") === "XMLHttpRequest") {
          return res.status(400).json({
              success: false,
              message: errorMessage
          });
      }

      return flashError(req, res, errorMessage, redirectUrl);
    } finally {
      client?.release();
    }
  }
);

router.get("/delete_file", checkAuth, async (req, res) => {
  try {
    const id = Number(req.query.id);
    const docId = Number(req.query.documentId);
    if (!Number.isInteger(id) || !Number.isInteger(docId)) return res.status(400).send("Parameter tidak valid.");

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query( `DELETE FROM uploaded_documents WHERE id = $1 AND upload_document_id = $2 RETURNING stored_filename`, [docId, id] );
      if (!result.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(404).send("Dokumen tidak ditemukan.");
      }
      await client.query("UPDATE upload_document SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
      await client.query("COMMIT");

      const integration = await getIntegration(id);
      if (integration) {
        await fs.unlink(path.join(STORAGE_ROOT, integration.folder_name, result.rows[0].stored_filename)).catch(err => {
          if (err.code !== "ENOENT") console.error(err);
        });
      }
      req.flash("success", "Dokumen berhasil dihapus.");
      return res.redirect(`/read_data?id=${id}`);
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("GET /delete_file error:", err);
    res.status(500).send("Gagal menghapus dokumen.");
  }
});

router.get("/delete", checkAuth, async (req, res) => {
  try {
    const idQuery = req.query.id;
    if (!idQuery) return res.status(400).send("ID tidak valid.");

    const idStrings = String(idQuery).split(",");
    const ids = [];

    for (const str of idStrings) {
      const parsedId = Number(str.trim());
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return res.status(400).send("ID tidak valid.");
      }
      ids.push(parsedId);
    }

    for (const id of ids) {
      const integration = await getIntegration(id);
      
      if (integration) {
        await db.query("DELETE FROM upload_document WHERE id = $1", [id]);
        
        if (integration.folder_name) {
          await fs.rm(path.join(STORAGE_ROOT, integration.folder_name), { 
            recursive: true, 
            force: true 
          });
        }
      }
    }

    const successMessage = ids.length > 1 
      ? "Semua data integrasi yang dipilih dan seluruh dokumennya berhasil dihapus."
      : "Data integrasi dan seluruh dokumennya berhasil dihapus.";

    req.flash("success", successMessage);
    return res.redirect("/");

  } catch (err) {
    console.error("GET /delete error:", err);
    res.status(500).send("Gagal menghapus data integrasi.");
  }
});


router.get("/login", isAlreadyLoggedIn, (req, res) => {
  res.render("login.ejs", { errorMessage: req.flash("error")[0] || "" });
});

router.post("/login", async (req, res) => {
  try {
    const username = text(req.body.username, 150);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const result = await db.query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash("error", "Username atau password salah.");
      return res.redirect("/login");
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    return res.redirect("/");
  } catch (err) {
    console.error("POST /login error:", err);
    res.status(500).send("Terjadi kesalahan saat login.");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send("Gagal logout.");
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

export default router;
