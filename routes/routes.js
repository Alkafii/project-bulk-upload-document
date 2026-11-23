import express from "express";
import db from "../config/database.js";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

import { getDocumentConfig } from "../config/documentFields.js";


import { 
  upload, 
  targetLocation
} from "../middleware/upload.js";

import { MAX_MB, MAX_FILE_SIZE } from "../config/uploadConfig.js";

const router = express.Router();

async function dynamicUploadFields(req, res, next) {
    try {
        const { uploadFields } = await getDocumentConfig();

        upload.fields(uploadFields)(req, res, next);

    } catch (err) {
        next(err);
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function unlinkWithRetry(filePath, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await fs.promises.unlink(filePath);
      return;
    } catch (err) {
      if (err.code === "ENOENT") return;

      if (attempt === attempts) throw err;

      await sleep(200 * attempt);
    }
  }
}

async function removeDirectoryWithRetry(folderPath) {
  await fs.promises.rm(folderPath, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200
  });
}

function resolveSafePath(basePath, ...segments) {
  const resolvedBase = path.resolve(basePath);
  const resolvedTarget = path.resolve(resolvedBase, ...segments);
  const relativePath = path.relative(resolvedBase, resolvedTarget);

  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("INVALID_PATH");
  }

  return resolvedTarget;
}


router.get("/", checkAuth, async (req, res) => {
  try {
    const { documentForm } = await getDocumentConfig();

    const baseDocumentCount =
      documentForm.integration.length +
      documentForm.aspi.length +
      documentForm.functionality.length;   

      const dataDb = (await db.query("SELECT * FROM upload_document ORDER BY id ASC")).rows;
      let tableData = "";

      let data = {
        institution: "",
        integration: "",
        create_date: "",
        rowData: "",
        message: req.flash("success")[0] || ""
      };

      if(dataDb.length > 0) {
        for(let i = 0; i < dataDb.length; i++) {
          const totalDocument = dataDb[i];

          let targetDocument;
          if (totalDocument.api_name === "QRIS MPM SNAP") {
              targetDocument = baseDocumentCount + documentForm.devsite.qris.length;
          } else if (totalDocument.va_type === "Off Us") {
              targetDocument = baseDocumentCount + documentForm.devsite.vaOff.length;
          } else {
              targetDocument = baseDocumentCount + documentForm.devsite.vaOn.length;
          }

          const filesArray = typeof totalDocument.uploaded_files === "string" ? JSON.parse(totalDocument.uploaded_files) : (totalDocument.uploaded_files || []);
          tableData += `<div class="row no-gutters p-3 text-center align-items-center border-bottom" style="font-size: 0.9rem; background-color: #fff;">
                            <div class="col-1 d-flex align-items-center justify-content-start pl-3">
                                <div style="width: 32px;" class="text-left">
                                    <input type="checkbox" id="check_${dataDb[i].id}" class="check" value="${dataDb[i].id}" data-name="${dataDb[i].name}" />
                                </div>
                                <span class="font-weight-bold text-muted pl-1">${i + 1}</span>
                            </div>
                            <div class="col-2 text-left font-weight-bold text-dark pl-3">${dataDb[i].name}</div>
                            <div class="col-3 text-left text-secondary">${dataDb[i].api_name} ${dataDb[i].va_type || ''}</div>
                            <div class="col-2 text-left text-dark">${String(dataDb[i].created_at).slice(0, 24)}</div>
                            <div class="col-2 text-left text-dark">${String(dataDb[i].updated_at).slice(0, 24)}</div>
                            <div class="col-1 text-center font-weight-bold">${filesArray.length}/${targetDocument}</div>
                            <div class="col-1">
                                <a class="btn btn-outline-primary btn-sm" href="/read_data?id=${dataDb[i].id}">View</a>
                            </div>
                        </div>`;
        }
        data.rowData = tableData;
      } else {
        data.rowData = `<div class="row no-gutters p-4 text-center bg-white text-muted justify-content-center">Belum ada data integrasi API.</div>`;
      }

      res.render("index.ejs", data);
  } catch(err) {
      console.log(err);
      res.status(500).send("Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.");
  }
});


router.get("/upload", checkAuth, async (req, res) => {
    try {
        const { documentForm } = await getDocumentConfig();
        const result = (await db.query(`SELECT name, document_names FROM document_name ORDER BY name ASC`)).rows;

        if (!result) {
          return res.status(404).send("Data tidak ditemukan.");
        }

        const documentCategory = result.map(row => `<option value="${row.name}">${row.name}</option>`).join("");     

        res.render("upload.ejs", {
            message: req.flash("success")[0] || "",
            errorMessage: req.flash("error")[0] || "",

            maxMB: MAX_MB,
            maxFileSize: MAX_FILE_SIZE,

            documentCategory: documentCategory,
            documentForm
        });

    } catch (err) {
        console.error("Error GET /upload:", err);
        req.flash("error", "Terjadi kesalahan server saat mengunggah dokumen. Silakan coba lagi.");
        return res.redirect("/upload");
    }
});


router.post("/upload", checkAuth, dynamicUploadFields, async (req, res) => {
  try {
      if (!req.files || Object.keys(req.files).length === 0) {
        req.flash("error", "Anda belum upload dokumen!")
        return res.redirect("/upload");
      }

      const institution = req.body.institutionName || "Unknown";
      let integration = req.body.integrationType || "General";
      const vaType = req.body.vaType || " ";
      const date = new Date().toLocaleString('sv-SE');

      const uploadedDocuments = [];
      let folderName = "Unknown-Folder";

      for (const fieldName in req.files) {
        const fileObject = req.files[fieldName][0]; 
        const filenameWithExt = fileObject.filename; 
        
        uploadedDocuments.push(filenameWithExt);

        if (folderName === "Unknown-Folder" && fileObject.destination) {
          folderName = path.basename(fileObject.destination);
        }
      };
  
      await db.query("INSERT INTO upload_document (name, api_name, va_type, folder_name, created_at, updated_at, uploaded_files) VALUES ($1, $2, $3, $4, $5, $6, $7)", [institution, integration, vaType, folderName, date, date, JSON.stringify(uploadedDocuments)]);

      req.flash("success", "Dokumen berhasil diupload");
      return res.redirect("/");
  } catch(err) {
      console.log(err);
      res.status(500).send("Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.");
  }
});


router.get("/read_data", checkAuth, async (req, res) => {
  try {
    const { documentForm, requiredDocuments} = await getDocumentConfig();
    const id = req.query.id;

    if (!id || id === "") {
      return res.status(400).send("ID data tidak valid.");
    }

    const dataDb = (await db.query("SELECT * FROM upload_document WHERE id = $1", [id])).rows;
    const targetData = dataDb[0]; 

    if (!targetData) {
      return res.status(404).send("Data yang anda cari tidak ditemukan!.");
    }

    let uploaded_file = [];
    const dbFiles = targetData.uploaded_files;
    if (dbFiles) {
      try {
        uploaded_file = typeof dbFiles === "string" ? JSON.parse(dbFiles) : dbFiles;
      } catch (err) {
        console.log("Gagal parse JSON dari DB, beralih ke array kosong.");
      }
    }

    let fields = {};

    for (let i = 0; i < requiredDocuments.length; i++) {
      const docName = requiredDocuments[i];

      const foundFileName = uploaded_file.find(function(file) {
        return file.startsWith(docName);
      });
      
      let isUploaded = (foundFileName !== undefined);

      if (isUploaded) {
        fields[docName] = `<div class="custom-file">
                              <input type="file" class="custom-file-input" name="${docName}" id="doc_${i}" accept=".pdf,.doc,.docx,.xls,.xlsx" disabled />
                              <label class="custom-file-label text-truncate text-success" for="doc_${i}" id="label_doc_${i}" data-browse="🔒︎" style="padding-right: 15px; font-weight: 500;" >
                                ${foundFileName}
                              </label>
                           </div>
                           <small class="form-text text-muted"> Document has been saved. Click <a href="/view_file?id=${id}&fileName=${foundFileName}" target="_blank" class="font-weight-bold text-primary">here to view</a></a> this document.</small>`;
      } else {
        fields[docName] = `<div class="custom-file">
                              <input type="file" class="custom-file-input" name="${docName}" id="doc_${i}" accept=".pdf,.doc,.docx,.xls,.xlsx" disabled>
                              <label class="custom-file-label text-truncate text-muted" id="label_doc_${i}" for="doc_${i}" data-browse="📄" style="padding-right: 15px;">Belum ada dokumen</label>
                          </div>
                          <small class="form-text text-muted text-danger">Dokumen ini belum diunggah.</small>`;
      }
    }

    const formatCreateDate = targetData.created_at ? targetData.created_at.toString().slice(0, 33) : "-";
    
    let data = {
      id: id,
      institution: targetData.name, 
      integration: targetData.api_name,
      vaType: targetData.va_type,
      create_date: formatCreateDate,
      message: req.flash("success")[0] || "",
      errorMessage: req.flash("error")[0] || "",
      fields: fields,
      maxMB: MAX_MB,
      maxFileSize: MAX_FILE_SIZE,
      documentForm: documentForm
    };

    res.render("read_data.ejs", data);

  } catch (err) {
    console.error("Error pada rute read_data:", err);
    res.status(500).send("Terjadi kesalahan pada sistem.");
  }
});



router.get("/view_file", checkAuth, async (req, res) => {
  try {
    const id = req.query.id;
    const fileName = req.query.fileName;

    if (typeof id === "undefined" || id === "") {
      return res.status(400).send("ID data tidak valid.");
    }

    if (!fileName || typeof fileName !== "string") {
      return res.status(400).send("Nama file wajib diisi.");
    }

    if (path.basename(fileName) !== fileName) {
      return res.status(400).send("Nama file tidak valid.");
    }

    const dataDb = (await db.query("SELECT * FROM upload_document WHERE id = $1", [id])).rows;

    if (dataDb.length === 0) {
      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    const targetData = dataDb[0];
    let uploadedFiles = [];

    try {
      uploadedFiles = typeof targetData.uploaded_files === "string" ? JSON.parse(targetData.uploaded_files) : targetData.uploaded_files || [];
    } catch (err) {
      console.error("Format uploaded_files tidak valid:", err);
      return res.status(500).send("Data dokumen pada database tidak valid.");
    }

    if (!uploadedFiles.includes(fileName)) {
      return res.status(404).send("Dokumen tidak terdaftar pada integrasi ini.");
    }

    const savedFolderName = targetData.folder_name;
    const baseFolder = path.resolve(process.cwd(), "data", "uploaded_file");
    const absoluteFilePath = path.resolve(baseFolder, savedFolderName, fileName);

    const relativeFile = path.relative(baseFolder, absoluteFilePath);
    if (!relativeFile || relativeFile === ".." || relativeFile.startsWith(`..${path.sep}`) || path.isAbsolute(relativeFile)) {
      return res.status(403).send("Akses dokumen ditolak.");
    }

    try {
      const fileStat = await fs.promises.stat(absoluteFilePath);
      if (!fileStat.isFile()) {
        return res.status(404).send("Berkas tidak ditemukan.");
      }

      const ext = path.extname(fileName).toLowerCase();
      let contentType = "application/octet-stream";
      
      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === ".doc") contentType = "application/msword";
      else if (ext === ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      else if (ext === ".xls") contentType = "application/vnd.ms-excel";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      
      const fileStream = fs.createReadStream(absoluteFilePath);
      fileStream.pipe(res);

    } catch (err) {
      return res.status(404).send("Berkas fisik tidak ditemukan di dalam folder penyimpanan server.");
    }
  } catch (err) {
    console.error("Error pada view_file:", err);
    res.status(500).send("Terjadi kesalahan sistem saat memproses penampilan berkas.");
  }
});



router.get("/delete_file", checkAuth, async (req, res) => {
  const { id, fileName } = req.query;

  let client;
  let transactionStarted = false;
  let committed = false;

  let sourcePath = null;
  let quarantinePath = null;
  let movedToQuarantine = false;

  try {
    if (!id || typeof id !== "string" ||
        !fileName || typeof fileName !== "string") {
      return res.status(400).send("ID dan nama file wajib diisi.");
    }

    if (
      fileName !== path.basename(fileName) ||
      fileName.includes("/") ||
      fileName.includes("\\") ||
      fileName.startsWith(".")
    ) {
      return res.status(400).send("Nama file tidak valid.");
    }

    client = await db.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    const result = await client.query(
      `SELECT folder_name, uploaded_files
       FROM upload_document
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    const { folder_name, uploaded_files } = result.rows[0];

    if (
      !folder_name ||
      folder_name !== path.basename(folder_name) ||
      folder_name.includes("/") ||
      folder_name.includes("\\")
    ) {
      throw new Error("INVALID_FOLDER");
    }

    let uploadedDocuments = [];

    try {
      uploadedDocuments = typeof uploaded_files === "string"
        ? JSON.parse(uploaded_files)
        : uploaded_files || [];
    } catch {
      throw new Error("INVALID_DOCUMENT_DATA");
    }

    if (!Array.isArray(uploadedDocuments)) {
      throw new Error("INVALID_DOCUMENT_DATA");
    }

    if (!uploadedDocuments.includes(fileName)) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).send("Dokumen tidak ditemukan.");
    }

    const baseFolder = path.resolve(
      process.cwd(),
      "data",
      "uploaded_file"
    );

    const folderPath = resolveSafePath(baseFolder, folder_name);
    sourcePath = resolveSafePath(folderPath, fileName);

    quarantinePath = path.join(
      folderPath,
      `.deleting-${randomUUID()}`
    );

    try {
      await fs.promises.rename(sourcePath, quarantinePath);
      movedToQuarantine = true;
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    const updatedDocuments = uploadedDocuments.filter(
      file => file !== fileName
    );

    await client.query(
      `UPDATE upload_document
       SET uploaded_files = $1,
           updated_at = $2
       WHERE id = $3`,
      [
        JSON.stringify(updatedDocuments),
        new Date().toLocaleString("sv-SE"),
        id
      ]
    );

    await client.query("COMMIT");
    committed = true;
    transactionStarted = false;

    if (movedToQuarantine) {
      try {
        await unlinkWithRetry(quarantinePath);
      } catch (cleanupError) {
        console.error(
          "File quarantine belum berhasil dibersihkan:",
          quarantinePath,
          cleanupError
        );
      }
    }

    req.flash("success", "Dokumen berhasil dihapus!");
    return res.redirect(`/update_data?id=${encodeURIComponent(id)}`);

  } catch (err) {
    console.error("Error DELETE FILE:", err);

    if (client && transactionStarted && !committed) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback gagal:", rollbackError);
      }

      transactionStarted = false;
    }

    if (movedToQuarantine && !committed) {
      try {
        await fs.promises.rename(quarantinePath, sourcePath);
      } catch (restoreError) {
        console.error(
          "PERHATIAN: Gagal mengembalikan file:",
          restoreError
        );
      }
    }

    if (err.message === "INVALID_PATH") {
      return res.status(403).send("Akses file ditolak.");
    }

    if (err.message === "INVALID_FOLDER") {
      return res.status(400).send("Nama folder tidak valid.");
    }

    if (err.message === "INVALID_DOCUMENT_DATA") {
      return res.status(500).send("Data dokumen di database tidak valid.");
    }

    return res.status(500).send(
      "Gagal menghapus dokumen. Silakan periksa log server."
    );

  } finally {
    if (client) client.release();
  }
});


router.get("/update_data", checkAuth, async (req, res) => {
  try {
    const { documentForm, requiredDocuments } = await getDocumentConfig();
    const id = req.query.id;
    if (!id || id === "") {
      return res.status(400).send("ID data tidak valid.");
    }

    const dataDb = (await db.query("SELECT * FROM upload_document WHERE id = $1", [id])).rows;
    const targetData = dataDb[0]; 

    if (!targetData) {
      return res.status(404).send("Data tidak ditemukan.");
    }

    let uploaded_file = [];
    if (targetData.uploaded_files) {
      uploaded_file = typeof targetData.uploaded_files === "string" ? JSON.parse(targetData.uploaded_files) : targetData.uploaded_files;
    }

    let fields = {};
    for (let i = 0; i < requiredDocuments.length; i++) {
      const docName = requiredDocuments[i];
      const foundFileName = uploaded_file.find(file => file.startsWith(docName));
      
      if (foundFileName) {
        fields[docName] = `<div class="custom-file">
                              <input type="file" class="custom-file-input" name="${docName}" id="doc_${i}" accept=".pdf,.doc,.docx,.xls,.xlsx" style="cursor: pointer;" />
                              <label class="custom-file-label text-truncate text-success" for="doc_${i}" id="label_doc_${i}" data-browse="🗙" style="padding-right: 50px; font-weight: 500;">
                                ${foundFileName}
                              </label>
                              <button type="button" class="position-absolute h-100 d-flex align-items-center justify-content-center text-decoration-none text-secondary"  style="right: 0; top: 0; width: 42px; z-index: 10; background-color: #e9ecef; border-left: 1px solid #ced4da; border-radius: 0 0.25rem 0.25rem 0; font-size: 16px; cursor: pointer; border: none;" title="Hapus berkas ini" data-toggle="modal" data-target="#modalDeleteConfirmation" data-id="${id}" data-filename="${foundFileName}">
                                  🗙
                              </button>
                           </div>
                           <small class="form-text text-muted">File has been saved.</small>`;
      } else {
        fields[docName] = `<div class="custom-file">
                              <input type="file" class="custom-file-input" name="${docName}" id="doc_${i}" accept=".pdf,.doc,.docx,.xls,.xlsx">
                              <label class="custom-file-label text-truncate text-muted" id="label_doc_${i}" for="doc_${i}" data-browse="📄" style="padding-right: 50px;">Choose file</label>
                           </div>
                           <small class="form-text text-muted">File formats: PDF, DOCX, XLSX.</small>`;
      }
    }

    res.render("update_data.ejs", {
        id: id,
        institution: targetData.name,
        integration: targetData.api_name,
        vaType: targetData.va_type,
        create_date: targetData.created_at
            ? targetData.created_at.toString().slice(0, 33)
            : "-",
        message: req.flash("success")[0] || "",
        errorMessage: req.flash("error")[0] || "",
        fields: fields,
        documentForm: documentForm,
        maxMB: MAX_MB,
        maxFileSize: MAX_FILE_SIZE
    });

  } catch (err) {
    console.error("Error pada rute update_data GET:", err);
    res.status(500).send("Terjadi kesalahan sistem.");
  }
});


router.post("/update_data", checkAuth, dynamicUploadFields, async (req, res) => {
  try {
    const id = req.query.id;
    if (!id || id === "") {
      return res.status(400).send("ID data tidak valid.");
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        req.flash("error", "Anda belum memilih dokumen baru untuk diperbarui!");
        return res.redirect(`/update_data?id=${id}`);
      };

    const dataDb = (await db.query("SELECT * FROM upload_document WHERE id = $1", [id])).rows;
    const targetData = dataDb[0];
    const date = new Date().toLocaleString('sv-SE');

    if (!targetData) {
      return res.status(404).send("Data tidak ditemukan.");
    }

    let uploadedDocuments = [];
    if (targetData.uploaded_files) {
      try {
        uploadedDocuments = typeof targetData.uploaded_files === "string"
          ? JSON.parse(targetData.uploaded_files)
          : targetData.uploaded_files;
      } catch (e) {
        console.log("Gagal parse JSON dari DB, inisialisasi array kosong.");
        uploadedDocuments = [];
      }
    }

    if (req.files && Object.keys(req.files).length > 0) {
      const fullFolderPath = path.join(targetLocation, targetData.folder_name);

      for (const fieldName in req.files) {
        const fileObject = req.files[fieldName][0];
        const newFilenameWithExt = fileObject.filename;

        const oldFileIndex = uploadedDocuments.findIndex(file => file.startsWith(fieldName));

        if (oldFileIndex !== -1) {
          const oldFilename = uploadedDocuments[oldFileIndex];
          const oldFilePath = path.join(fullFolderPath, oldFilename);
          
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }

          uploadedDocuments[oldFileIndex] = newFilenameWithExt;
        } else {
          uploadedDocuments.push(newFilenameWithExt);
        }
      }
    }

    await db.query("UPDATE upload_document SET uploaded_files = $1, updated_at = $2 WHERE id = $3", [JSON.stringify(uploadedDocuments), date, id]);  

    req.flash("success", "Dokumen berhasil diperbarui!");
    return res.redirect("/");
    // res.redirect(`/read_data?id=${id}`);

  } catch (err) {
    console.error("Error pada rute update_data:", err);
    res.status(500).send("Terjadi kesalahan sistem saat memperbarui berkas.");
  }
});




router.get("/delete", checkAuth, async (req, res) => {
  const { id } = req.query;

  let client;
  let transactionStarted = false;
  let committed = false;

  let originalFolder = null;
  let quarantineFolder = null;
  let movedToQuarantine = false;

  try {
    if (!id || typeof id !== "string") {
      return res.status(400).send("ID data tidak valid.");
    }

    client = await db.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    const result = await client.query(
      `SELECT folder_name
       FROM upload_document
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).send(
        "Data integrasi tidak ditemukan."
      );
    }

    const folderName = result.rows[0].folder_name;

    if (folderName) {
      if (
        folderName !== path.basename(folderName) ||
        folderName.includes("/") ||
        folderName.includes("\\")
      ) {
        throw new Error("INVALID_FOLDER");
      }

      const baseFolder = path.resolve(
        process.cwd(),
        "data",
        "uploaded_file"
      );

      originalFolder = resolveSafePath(
        baseFolder,
        folderName
      );

      quarantineFolder = path.join(
        baseFolder,
        `.deleting-${randomUUID()}`
      );

      try {
        await fs.promises.rename(
          originalFolder,
          quarantineFolder
        );

        movedToQuarantine = true;

      } catch (err) {

        if (err.code !== "ENOENT") {
          throw err;
        }
      }
    }

    await client.query("DELETE FROM upload_document WHERE id = $1", [id]);

    await client.query("COMMIT");
    committed = true;
    transactionStarted = false;

    if (movedToQuarantine) {
      try {
        await removeDirectoryWithRetry(quarantineFolder);
      } catch (cleanupError) {
        console.error(
          "Folder quarantine belum berhasil dibersihkan:",
          quarantineFolder,
          cleanupError
        );
      }
    }

    req.flash("success", "Mitra berhasil dihapus!");

    return res.redirect("/");

  } catch (err) {
    console.error("Error DELETE INTEGRATION:", err);

    if (client && transactionStarted && !committed) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback gagal:", rollbackError);
      }

      transactionStarted = false;
    }

    if (movedToQuarantine && !committed) {
      try {
        await fs.promises.rename(
          quarantineFolder,
          originalFolder
        );
      } catch (restoreError) {
        console.error("PERHATIAN: Gagal mengembalikan folder:", restoreError);
      }
    }

    if (err.message === "INVALID_PATH") {
      return res.status(403).send("Akses folder ditolak.");
    }

    if (err.message === "INVALID_FOLDER") {
      return res.status(400).send("Nama folder tidak valid.");
    }

    return res.status(500).send(
      "Gagal menghapus data integrasi. Silakan periksa log server."
    );

  } finally {
    if (client) client.release();
  }
});


router.get("/api_names", checkAuth, async (req, res) => {
  try {
    const dataDb = (await db.query("SELECT * FROM document_name")).rows;
    
    let rowData = "";
    for(let i = 0; i < dataDb.length; i++) {
      const row = dataDb[i];
      const totalDocs = row.document_names ? (Array.isArray(row.document_names) ? row.document_names.length : 1) : 0;
      rowData += `<tr>
                      <td class="text-center align-middle">${i + 1}</td>
                      <td class="align-middle">${row.name}</td>
                      <td class="align-middle">${totalDocs} Documents</td>
                      <td class="text-center align-middle">
                          <button type="button" class="btn btn-sm btn-outline-secondary" 
                              data-toggle="modal" 
                              data-target="#modalEditDocument" 
                              data-id="${row.id || ''}"
                              data-name="${row.name}">
                              Edit
                          </button>

                          <form action="/document_names/delete" method="POST" class="d-inline">
                              <input type="hidden" name="id" value="${row.id || ''}">
                              <input type="hidden" name="documentName" value="${row.name}">
                              
                              <button type="button" class="btn btn-sm btn-outline-danger btn-trigger-delete" 
                                  data-toggle="modal" 
                                  data-target="#modalDeleteConfirmation" 
                                  data-id="${row.id || ''}" 
                                  data-document="${row.name}">
                                  Delete
                              </button>
                          </form>
                      </td>
                  </tr>`;
    }

    return res.render("add_api_name.ejs", { rowData: rowData });
  } catch(err) {
    console.error("Error GET /api_names:", err); //  Disamakan dengan nama rutenya agar log akurat
    return res.status(500).send(
      "Terjadi kesalahan saat mengambil data dokumen."
    );
  }
});


router.post("/api_names", checkAuth, async (req, res) => {
  try {
    let apiName = req.body.apiName;

    if (!apiName || apiName.trim() === "") {
        req.flash("error", "Nama API tidak boleh kosong!");
        return res.redirect("/api_names");
    }

    apiName = apiName.trim();

    if (apiName.length > 150) {
        req.flash("error", "Nama API terlalu panjang! Maksimal 150 karakter.");
        return res.redirect("/api_names");
    }

    apiName = apiName
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");

    const checkDuplicate = await db.query(
        "SELECT id FROM document_name WHERE name ILIKE $1", 
        [apiName]
    );

    if (checkDuplicate.rows.length > 0) {
        req.flash("error", `API dengan nama "${apiName}" sudah terdaftar!`);
        return res.redirect("/api_names");
    }

    console.log("Menambahkan API Baru yang Aman:", apiName);
    await db.query(
        "INSERT INTO document_name (name, document_names) VALUES ($1, $2)", 
        [apiName, JSON.stringify([])]
    );

    req.flash("success", "API Baru berhasil ditambahkan!");
    return res.redirect("/api_names");

  } catch(err) {
    console.error("Error POST /api_names:", err); 
    req.flash("error", "Terjadi kesalahan server saat menyimpan data API baru.");
    return res.redirect("/api_names");
  }
});



router.get("/document_names", checkAuth, async (req, res) => {
    try {
        const result = (await db.query(`SELECT name, document_names FROM document_name ORDER BY name ASC`)).rows;

        if (!result) {
          return res.status(404).send("Data tidak ditemukan.");
        }

        const documentCategory = result.map(row => `<option value="${row.name}">${row.name}</option>`).join("");

        const documentGroups = result.map(row => {
            let documents = row.document_names || [];

            if (typeof documents === "string") {
                documents = JSON.parse(documents);
            }

            return {
                name: row.name,
                documents: documents.map(document => ({
                    name: document
                }))
            };
        });

        return res.render("add_document_name.ejs", {
            documentGroups,
            message: req.flash("success")[0] || "",
            errorMessage: req.flash("error")[0] || "",
            documentCategory: documentCategory
        });

    } catch (err) {
        console.error("Error GET /document_names:", err);

        return res.status(500).send(
            "Terjadi kesalahan saat mengambil data dokumen."
        );
    }
});


router.post("/document_names", checkAuth, async (req, res) => {
    let client;

    try {
        const category = req.body.category;
        const documentName = req.body.documentName;

        if (
            typeof category !== "string" ||
            typeof documentName !== "string"
        ) {
            req.flash("error", "Data dokumen tidak valid.");
            return res.redirect("/document_names");
        }

        const cleanCategory = category.trim();
        const cleanDocumentName = documentName.trim();

        if (
            !cleanDocumentName ||
            cleanDocumentName.length > 150
        ) {
            req.flash("error", "Nama dokumen wajib diisi dan maksimal 150 karakter.");

            return res.redirect("/document_names");
        }

        client = await db.connect();

        await client.query("BEGIN");

        const result = await client.query(`SELECT document_names, pg_typeof(document_names)::text AS data_type FROM document_name WHERE name = $1 FOR UPDATE`, [cleanCategory]);

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            req.flash("error", "Kategori dokumen tidak ditemukan.");
            return res.redirect("/document_names");
        }

        const targetData = result.rows[0];

        let documents = targetData.document_names || [];

        if (typeof documents === "string") {
            documents = JSON.parse(documents);
        }

        if (!Array.isArray(documents)) {
            throw new Error("INVALID_DOCUMENT_FORMAT");
        }

        const isDuplicate = documents.some(document =>
            String(document).trim().toLowerCase() ===
            cleanDocumentName.toLowerCase()
        );

        if (isDuplicate) {
            await client.query("ROLLBACK");

            req.flash("error", "Nama dokumen sudah terdaftar pada kategori ini.");
            return res.redirect("/document_names");
        }

        const updatedDocuments = [...documents, cleanDocumentName];

        let updateValue;
        let castExpression = "$1";

        if (targetData.data_type === "jsonb") {
            updateValue = JSON.stringify(updatedDocuments);
            castExpression = "$1::jsonb";
        } else if (targetData.data_type === "json") {
            updateValue = JSON.stringify(updatedDocuments);
            castExpression = "$1::json";
        } else if (targetData.data_type === "text") {
            updateValue = JSON.stringify(updatedDocuments);
        } else {
            updateValue = updatedDocuments;
        }

        await client.query( `UPDATE document_name SET document_names = ${castExpression} WHERE name = $2`, [updateValue, cleanCategory]);

        await client.query("COMMIT");

        req.flash("success", "Nama dokumen berhasil ditambahkan!");

        return res.redirect("/document_names");

    } catch (err) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback gagal:", rollbackError);
            }
        }

        console.error("Error POST /document_names:", err);

        if (err.message === "INVALID_DOCUMENT_FORMAT") {
            req.flash("error", "Format daftar dokumen pada database tidak valid.");
            return res.redirect("/document_names");
        }

        req.flash("error", "Gagal menambahkan nama dokumen.");
        return res.redirect("/document_names");

    } finally {
        if (client) client.release();
    }
});



router.post("/document_names/update", checkAuth, async (req, res) => {
    let client;

    try {
        const {
            category,
            oldDocumentName,
            newDocumentName
        } = req.body;

        const cleanCategory = category?.trim();
        const oldName = oldDocumentName?.trim();
        const newName = newDocumentName?.trim();

        if (!cleanCategory || !oldName || !newName || newName.length > 150) {
            req.flash("error", "Data perubahan dokumen tidak valid.");
            return res.redirect("/document_names");
        }

        if (oldName === newName) {
            req.flash("error", "Tidak ada perubahan nama dokumen.");
            return res.redirect("/document_names");
        }

        const { requiredDocuments } = await getDocumentConfig();

        const duplicate = requiredDocuments.some(name =>
            name.toLowerCase() === newName.toLowerCase() &&
            name !== oldName
        );

        if (duplicate) {
            req.flash("error", "Nama dokumen sudah digunakan oleh field lain.");
            return res.redirect("/document_names");
        }

        client = await db.connect();
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT document_names,
                    pg_typeof(document_names)::text AS data_type
             FROM document_name
             WHERE name = $1
             FOR UPDATE`,
            [cleanCategory]
        );

        if (result.rows.length === 0) {
            throw new Error("CATEGORY_NOT_FOUND");
        }

        const target = result.rows[0];

        let documents = target.document_names || [];

        if (typeof documents === "string") {
            documents = JSON.parse(documents);
        }

        if (!Array.isArray(documents)) {
            throw new Error("INVALID_DOCUMENT_FORMAT");
        }

        const index = documents.findIndex(
            name => String(name).trim() === oldName
        );

        if (index === -1) {
            throw new Error("DOCUMENT_NOT_FOUND");
        }

        const uploadedResult = await client.query(
            "SELECT uploaded_files FROM upload_document"
        );

        const alreadyUsed = uploadedResult.rows.some(row => {
            let files = row.uploaded_files || [];

            if (typeof files === "string") {
                files = JSON.parse(files);
            }

            return Array.isArray(files) &&
                files.some(file => file.startsWith(`${oldName}-`));
        });

        if (alreadyUsed) {
            throw new Error("DOCUMENT_ALREADY_USED");
        }

        documents[index] = newName;

        let updateValue;
        let castExpression = "$1";

        if (target.data_type === "jsonb") {
            updateValue = JSON.stringify(documents);
            castExpression = "$1::jsonb";
        } else if (target.data_type === "json") {
            updateValue = JSON.stringify(documents);
            castExpression = "$1::json";
        } else if (target.data_type === "text") {
            updateValue = JSON.stringify(documents);
        } else {
            updateValue = documents;
        }

        await client.query(`UPDATE document_name SET document_names = ${castExpression} WHERE name = $2`, [updateValue, cleanCategory]);

        await client.query("COMMIT");

        req.flash("success", "Nama dokumen berhasil diperbarui!");
        return res.redirect("/document_names");

    } catch (err) {
        if (client) {
            await client.query("ROLLBACK").catch(console.error);
        }

        console.error("Error UPDATE document name:", err);

        const messages = {
            CATEGORY_NOT_FOUND: "Kategori dokumen tidak ditemukan.",
            DOCUMENT_NOT_FOUND: "Nama dokumen tidak ditemukan.",
            INVALID_DOCUMENT_FORMAT: "Format data dokumen tidak valid.",
            DOCUMENT_ALREADY_USED:
                "Nama tidak dapat diubah karena dokumen sudah pernah digunakan untuk upload."
        };

        req.flash(
            "error",
            messages[err.message] || "Gagal memperbarui nama dokumen."
        );

        return res.redirect("/document_names");

    } finally {
        if (client) client.release();
    }
});



router.post("/document_names/delete", checkAuth, async (req, res) => {
    let client;

    try {
        const category = req.body.category?.trim();
        const documentName = req.body.documentName?.trim();

        if (!category || !documentName) {
            req.flash("error", "Data dokumen tidak valid.");
            return res.redirect("/document_names");
        }

        client = await db.connect();
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT document_names,
                    pg_typeof(document_names)::text AS data_type
             FROM document_name
             WHERE name = $1
             FOR UPDATE`,
            [category]
        );

        if (result.rows.length === 0) {
            throw new Error("CATEGORY_NOT_FOUND");
        }

        const target = result.rows[0];

        let documents = target.document_names || [];

        if (typeof documents === "string") {
            documents = JSON.parse(documents);
        }

        if (!Array.isArray(documents)) {
            throw new Error("INVALID_DOCUMENT_FORMAT");
        }

        const exists = documents.some(
            name => String(name).trim() === documentName
        );

        if (!exists) {
            throw new Error("DOCUMENT_NOT_FOUND");
        }

        const uploadedResult = await client.query(
            "SELECT uploaded_files FROM upload_document"
        );

        const alreadyUsed = uploadedResult.rows.some(row => {
            let files = row.uploaded_files || [];

            if (typeof files === "string") {
                files = JSON.parse(files);
            }

            return Array.isArray(files) &&
                files.some(file => file.startsWith(`${documentName}-`));
        });

        if (alreadyUsed) {
            throw new Error("DOCUMENT_ALREADY_USED");
        }

        const updatedDocuments = documents.filter(
            name => String(name).trim() !== documentName
        );

        let updateValue;
        let castExpression = "$1";

        if (target.data_type === "jsonb") {
            updateValue = JSON.stringify(updatedDocuments);
            castExpression = "$1::jsonb";
        } else if (target.data_type === "json") {
            updateValue = JSON.stringify(updatedDocuments);
            castExpression = "$1::json";
        } else if (target.data_type === "text") {
            updateValue = JSON.stringify(updatedDocuments);
        } else {
            updateValue = updatedDocuments;
        }

        await client.query(
            `UPDATE document_name
             SET document_names = ${castExpression}
             WHERE name = $2`,
            [updateValue, category]
        );

        await client.query("COMMIT");

        req.flash("success", "Nama dokumen berhasil dihapus!");
        return res.redirect("/document_names");

    } catch (err) {
        if (client) {
            await client.query("ROLLBACK").catch(console.error);
        }

        console.error("Error DELETE document name:", err);

        const messages = {
            CATEGORY_NOT_FOUND: "Kategori dokumen tidak ditemukan.",
            DOCUMENT_NOT_FOUND: "Nama dokumen tidak ditemukan.",
            INVALID_DOCUMENT_FORMAT: "Format data dokumen tidak valid.",
            DOCUMENT_ALREADY_USED:
                "Dokumen tidak dapat dihapus karena sudah pernah digunakan untuk upload."
        };

        req.flash(
            "error",
            messages[err.message] || "Gagal menghapus nama dokumen."
        );

        return res.redirect("/document_names");

    } finally {
        if (client) client.release();
    }
});



router.get("/login", isAlreadyLoggedIn, async (req, res) => {
  res.render("login.ejs");
});

router.post("/login", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    
  try {
    // ================================================== Untuk Register =======================================================
    // const saltRounds = 10;
    // bcrypt.hash(password, saltRounds, async (err, hash) => {
    //   await db.query("INSERT INTO users (username, password, accname, accnum) VALUES ($1, $2, $3, $4)", [password, hash, "Muhammad Ghossan Alkafi", Math.floor(Math.random() * 999)]);
    // })
    // ======================================================= end =============================================================

    const dataDb = (await db.query("SELECT id, username, password FROM users WHERE username = $1", [email])).rows;

    // =================================================== Untuk Login =========================================================
    if(dataDb.length === 0) {
      return res.status(400).send("Username atau password salah!.");
    }

    const targetData = dataDb[0];

    if (!targetData) {
          return res.status(404).send("Data yang anda cari tidak ditemukan!.");
    }

    const hashedPassword = targetData.password;
    const isAuth = await bcrypt.compare(password, hashedPassword);

    if(isAuth) {
      req.session.userId = targetData.id;
      req.session.username = targetData.username;
      return res.redirect("/upload");
    } else {
      req.flash("error", "Username atau password salah!.");
      return res.render("login.ejs");
    }
    // ======================================================= end =============================================================
  } catch(err) {
    console.error("Error pada route /login:", err);
    res.status(500).send("Terjadi kesalahan sistem pada route /login.");
  }
});

function checkAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

function isAlreadyLoggedIn(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect("/upload");
  }
  next();
}

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Gagal menghapus session:", err);
      return res.status(500).send("Gagal logout.");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});







export default router;