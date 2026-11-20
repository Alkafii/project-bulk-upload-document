import express from "express";
import db from "../config/database.js";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

import {
  REQUIRED_DOCUMENTS,
  UPLOAD_FIELDS
} from "../config/documentFields.js";

import { 
  upload, 
  targetLocation
} from "../middleware/upload.js";

import { MAX_MB, MAX_FILE_SIZE } from "../config/uploadConfig.js";

const router = express.Router();


router.get("/", checkAuth, async (req, res) => {
  try {
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
          const targetDocument = (totalDocument.va_type === "Off Us" || totalDocument.api_name === "QRIS MPM SNAP") ? 20 : 22;
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


router.get("/upload", checkAuth, (req, res) => {
  try {
      res.render("upload.ejs", { 
        message: req.flash("success")[0] || "", 
        errorMessage: req.flash("error")[0] || "", 

        maxMB: MAX_MB,
        maxFileSize: MAX_FILE_SIZE
      });
  } catch(err) {
      console.log(err);
      res.status(500).send("Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.");
  }
});


router.post("/upload", checkAuth, upload.fields(UPLOAD_FIELDS), async (req, res) => {
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

    for (let i = 0; i < REQUIRED_DOCUMENTS.length; i++) {
      const docName = REQUIRED_DOCUMENTS[i];

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
      maxFileSize: MAX_FILE_SIZE
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
  try {
    const id = req.query.id;
    const fileName = req.query.fileName;

    if (!id || !fileName) {
      return res.status(400).send("ID dan nama file wajib diisi.");
    }

    const dataDb = (await db.query("SELECT folder_name, uploaded_files FROM upload_document WHERE id = $1", [id])).rows;

    if (dataDb.length === 0) {
      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    const folderName = dataDb[0].folder_name;
    const date = new Date().toLocaleString("sv-SE");

    if (!folderName) {
      return res.status(400).send("Folder penyimpanan tidak ditemukan.");
    }

    const targetData = dataDb[0].uploaded_files;

    const arrayFile =
      typeof targetData === "string" ? JSON.parse(targetData) : targetData || [];

    if (!arrayFile.includes(fileName)) {
      return res.status(404).send("Dokumen tidak ditemukan.");
    }

    if (path.basename(folderName) !== folderName || path.basename(fileName) !== fileName) {
      return res.status(400).send("Nama folder atau file tidak valid.");
    }

    const baseFolder = path.resolve(process.cwd(), "data", "uploaded_file");
    const folderPath = path.resolve(baseFolder, folderName);
    const filePath = path.resolve(folderPath, fileName);

    const relativeFolder = path.relative(baseFolder, folderPath);
    const relativeFile = path.relative(folderPath, filePath);

    if (
      relativeFolder.startsWith("..") ||
      path.isAbsolute(relativeFolder) ||
      relativeFile.startsWith("..") ||
      path.isAbsolute(relativeFile)
    ) {
      return res.status(403).send("Akses file ditolak.");
    }

    await fs.promises.unlink(filePath);

    const updatedFiles = arrayFile.filter((file) => file !== fileName);

    await db.query("UPDATE upload_document SET updated_at = $1, uploaded_files = $2 WHERE id = $3", [date, JSON.stringify(updatedFiles), id]);

    req.flash("success", "Dokumen berhasil dihapus dari server!");
    return res.redirect(`/update_data?id=${id}`);
  } catch (err) {
    console.error("Error pada route delete_file:", err);

    if (err.code === "ENOENT") {
      return res.status(404).send("File fisik tidak ditemukan.");
    }

    res.status(500).send("Terjadi kesalahan pada sistem.");
  }
});


router.get("/update_data", checkAuth, async (req, res) => {
  try {
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
    for (let i = 0; i < REQUIRED_DOCUMENTS.length; i++) {
      const docName = REQUIRED_DOCUMENTS[i];
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
      create_date: targetData.created_at ? targetData.created_at.toString().slice(0, 33) : "-",
      message: req.flash("success")[0] || "",
      errorMessage: req.flash("error")[0] || "",
      fields: fields,
      maxMB: MAX_MB,
      maxFileSize: MAX_FILE_SIZE
    });

  } catch (err) {
    console.error("Error pada rute update_data GET:", err);
    res.status(500).send("Terjadi kesalahan sistem.");
  }
});


router.post("/update_data", upload.fields(UPLOAD_FIELDS), checkAuth, async (req, res) => {
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
  try{
    const id = req.query.id;

    if (typeof id === "undefined" || id === "") {
      return res.status(400).send("ID data tidak valid.");
    }

    const dataDb = (await db.query("SELECT folder_name FROM upload_document WHERE id = $1", [id])).rows;

    if(dataDb.length === 0) {
      return res.status(404).json({ message: 'Data integrasi tidak ditemukan!' });
    }

    const folderName = dataDb[0].folder_name;

    if (!folderName) {
      console.error('Folder penyimpanan tidak ditemukan:', { folderName });
      return res.status(400).json({ message: 'folderName wajib dikirim!' });

    } else {
      if (path.basename(folderName) !== folderName) {
        return res.status(400).send("Nama folder atau file tidak valid.");
      }
      
      const baseFolder = path.resolve(process.cwd(), "data", "uploaded_file");
      const folderPath = path.resolve(baseFolder, folderName);
      const relativeFolder = path.relative(baseFolder, folderPath);

      if (
        !relativeFolder || relativeFolder.startsWith("..") || path.isAbsolute(relativeFolder)
      ) {
        return res.status(403).send("Akses file ditolak.");
      }

      await fs.promises.rm(folderPath, { recursive: true, force: true });

      await db.query("DELETE FROM upload_document WHERE id = $1", [id]);

      req.flash("success", "Mitra berhasil dihapus!");
      return res.redirect("/");
    }
  } catch(err) {
    console.error("Error pada route /delete:", err);
    res.status(500).send("Terjadi kesalahan sistem pada route /delete.");
  }
});

router.get("/login", isAlreadyLoggedIn, async (req, res) => {
  res.render("login.ejs");
});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.username;
    const password = req.body.password;

    const dataDb = (await db.query("SELECT id, username, password FROM users WHERE username = $1", [email])).rows;

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