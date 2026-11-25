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
    const queryText = ` SELECT i.*, COUNT(d.id)::int AS uploaded_count, COALESCE(SUM(d.file_size), 0)::bigint AS total_file_size FROM upload_document i LEFT JOIN uploaded_documents d ON d.upload_document_id = i.id GROUP BY i.id ORDER BY i.id DESC `;
    
    const result = await db.query(queryText);

    if (!result || !Array.isArray(result.rows)) {
      return res.render("index.ejs", {
        integrations: [],
        message: req.flash("success")[0] || "",
        errorMessage: "Format data dari database tidak valid."
      });
    }

    const integrationsWithFormat = result.rows.map(item => {
      const sizeInMB = (Number(item.total_file_size) / (1024 * 1024)).toFixed(2);
      
      return {
        ...item,
        formatted_total_size: sizeInMB + " MB" // Menghasilkan string contoh: "0.32 MB"
      };
    });

    res.render("index.ejs", {
      integrations: integrationsWithFormat,
      message: req.flash("success")[0] || "",
      errorMessage: req.flash("error")[0] || ""
    });
  } catch (err) {
    console.error("GET / error:", err);
    res.status(500).send("Gagal mengambil data integrasi.");
  }
});


router.get("/upload", checkAuth, (req, res) => {
  res.render("upload.ejs", {
    maxMB: MAX_MB,
    maxFiles: MAX_FILES,
    maxTotalMB: MAX_TOTAL_MB,
    message: req.flash("success")[0] || "",
    errorMessage: req.flash("error")[0] || ""
  });
});

router.post("/upload", checkAuth, upload.array("documents", MAX_FILES), async (req, res) => {
  const folderName = `integration-${randomUUID()}`;
  const folderPath = path.join(STORAGE_ROOT, folderName);
  let client;
  let createdFiles = [];

  try {
    const files = req.files || [];
    validateUploadBatch(files);

    const institution = text(req.body.institutionName, 256)?.trim();
    const apiName = text(req.body.integrationType, 128)?.trim();
    const documentNames = ensureArray(req.body.documentNames).map(name => name?.trim());

    if (!institution || !apiName) {
      throw new Error("Nama mitra (Partner Name) dan API Name wajib diisi.");
    }
    if (files.length === 0) {
      throw new Error("Silakan pilih minimal 1 dokumen untuk diunggah.");
    }
    if (documentNames.length !== files.length) {
      throw new Error("Jumlah nama dokumen tidak sesuai dengan berkas yang dipilih.");
    }

    const lowerCaseNames = [];
    for (const docName of documentNames) {
      if (!docName) {
        throw new Error("Nama dokumen tidak boleh kosong.");
      }
      if (docName.length > 255) {
        throw new Error("Nama dokumen terlalu panjang (maksimal 255 karakter).");
      }
      lowerCaseNames.push(docName.toLowerCase());
    }
  
    if (new Set(lowerCaseNames).size !== lowerCaseNames.length) {
      throw new Error("Nama dokumen di dalam daftar tidak boleh ada yang sama.");
    }

    await fs.mkdir(folderPath, { recursive: true });

    client = await db.connect();
    await client.query("BEGIN");

    const integrationResult = await client.query(
      `INSERT INTO upload_document (name, api_name, folder_name, created_at, updated_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`,
      [institution, apiName, folderName]
    );
    const integrationId = integrationResult.rows[0].id;

    for (let i = 0; i < files.length; i++) {
      const metadata = await writeUploadedFile(files[i], folderPath);
      createdFiles.push(metadata.stored_filename);
      await insertDocument(client, integrationId, metadata, documentNames[i]);
    }

    await client.query("COMMIT");
    req.flash("success", `${files.length} dokumen berhasil diunggah.`);
    return res.redirect("/");

  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    if (createdFiles.length || folderName) {
      await fs.rm(folderPath, { recursive: true, force: true }).catch(() => {});
    }
    console.error("POST /upload error:", err);
    
    return flashError(req, res, err.message || "Gagal menyimpan dokumen.", "/upload");
  } finally {
    client?.release();
  }
});


router.get("/read_data", checkAuth, async (req, res) => {
  try {
    const id = Number(req.query.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).send("ID integrasi tidak valid.");

    const integration = await getIntegration(id);
    if (!integration) return res.status(404).send("Data integrasi tidak ditemukan.");

    const docs = await db.query(
      `SELECT id, document_name, original_filename, mime_type, file_size, created_at
       FROM uploaded_documents
       WHERE upload_document_id = $1
       ORDER BY id ASC`,
      [id]
    );

    let totalSize = 0;
    for (let i = 0; i < docs.rows.length; i++) {
      totalSize += Number(docs.rows[i].file_size);
    }
    
    res.render("read_data.ejs", {
      integration,
      totalSize: (totalSize / (1024 * 1024)).toFixed(2),
      documents: docs.rows,
      message: req.flash("success")[0] || "",
      errorMessage: req.flash("error")[0] || ""
    });
  } catch (err) {
    console.error("GET /read_data error:", err);
    res.status(500).send("Gagal membaca data integrasi.");
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
    if (!Number.isInteger(id) || id <= 0) return res.status(400).send("ID integrasi tidak valid.");

    const integration = await getIntegration(id);
    if (!integration) return res.status(404).send("Data integrasi tidak ditemukan.");

    const docs = await db.query(
      `SELECT id, document_name, original_filename, mime_type, file_size, created_at
       FROM uploaded_documents
       WHERE upload_document_id = $1
       ORDER BY id ASC`,
      [id]
    );

    res.render("update_data.ejs", {
      integration,
      documents: docs.rows,
      maxMB: MAX_MB,
      maxFiles: MAX_FILES,
      maxTotalMB: MAX_TOTAL_MB,
      message: req.flash("success")[0] || "",
      errorMessage: req.flash("error")[0] || ""
    });
  } catch (err) {
    console.error("GET /update_data error:", err);
    res.status(500).send("Gagal membuka halaman edit.");
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
        .map(Number).filter(n => Number.isInteger(n) && n > 0);
      const replacementIds = ensureArray(req.body.replacementDocumentIds).map(String);
      const newNames = ensureArray(req.body.newDocumentNames);

      if (replacementIds.length !== replacementFiles.length) {
        throw new Error("Data file pengganti tidak cocok. Silakan pilih ulang file pengganti.");
      }
      if (newNames.length !== newFiles.length) {
        throw new Error("Data nama dokumen baru tidak cocok dengan jumlah file.");
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

      if (deleteIds.length) {
        const deleted = await client.query(
          `DELETE FROM uploaded_documents
           WHERE upload_document_id = $1 AND id = ANY($2::bigint[])
           RETURNING stored_filename`,
          [id, deleteIds]
        );
        filesToDelete.push(...deleted.rows.map(row => row.stored_filename));
      }

      for (let i = 0; i < replacementFiles.length; i++) {
        const docId = Number(replacementIds[i]);
        if (!Number.isInteger(docId) || docId <= 0) throw new Error("ID dokumen pengganti tidak valid.");

        const old = await client.query(
          `SELECT stored_filename FROM uploaded_documents
           WHERE id = $1 AND upload_document_id = $2 FOR UPDATE`,
          [docId, id]
        );
        if (!old.rows[0]) throw new Error("Dokumen yang akan diganti tidak ditemukan.");

        const metadata = await writeUploadedFile(replacementFiles[i], folderPath);
        filesWritten.push(metadata.stored_filename);
        await client.query(
          `UPDATE uploaded_documents
           SET original_filename = $1, stored_filename = $2,
               mime_type = $3, file_size = $4, created_at = CURRENT_TIMESTAMP
           WHERE id = $5 AND upload_document_id = $6`,
          [metadata.original_filename, metadata.stored_filename, metadata.mime_type, metadata.file_size, docId, id]
        );
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

      req.flash("success", "Perubahan dokumen berhasil disimpan.");
      return res.redirect(`/read_data?id=${id}`);
    } catch (err) {
      if (client) await client.query("ROLLBACK").catch(() => {});
      if (folderPath) {
        for (const filename of filesWritten) {
          await fs.unlink(path.join(folderPath, filename)).catch(() => {});
        }
      }
      console.error("POST /update_data error:", err);
      return flashError(req, res, err.message || "Gagal memperbarui dokumen.", redirectUrl);
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
      const result = await client.query(
        `DELETE FROM uploaded_documents
         WHERE id = $1 AND upload_document_id = $2
         RETURNING stored_filename`,
        [docId, id]
      );
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
