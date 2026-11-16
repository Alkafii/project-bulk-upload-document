import express from "express";
import bodyParser from "body-parser";

import path from "path";
import fs from "fs";

import db from "./config/database.js"
import {
  REQUIRED_DOCUMENTS,
  UPLOAD_FIELDS
} from "./config/documentFields.js";

import {
  upload,
  targetLocation
} from "./middleware/upload.js"

import {
  sessionMiddleware, 
  flashMiddleware
} from "./middleware/session.js";

const app = express();
const port = 3000;


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(sessionMiddleware);
app.use(flashMiddleware);


// Homepage
app.get("/",async (req, res) => {
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
          tableData += `<div class="row no-gutters p-3 text-center align-items-center bg-white border-bottom">
                          <div class="col-1 text-left pl-3 font-weight-bold text-muted">${i + 1}</div>
                          <div class="col-3 text-left font-weight-bold text-dark">${dataDb[i].name}</div>
                          <div class="col-2 text-left text-monospace text-secondary">${dataDb[i].api_name} ${dataDb[i].va_type}</div>
                          <div class="col-2 text-left">${dataDb[i].created_at}</div>
                          <div class="col-2 text-left">${dataDb[i].updated_at}</div>
                          <div class="col-1 text-center"><b>${filesArray.length}</b>/${targetDocument}</div>
                          <div class="col-1 dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle py-0" type="button" id="dropdownMenuButton${i}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Edit
                            </button>
                            <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenu2">
                              <a class="dropdown-item" href="/read_data?id=${dataDb[i].id}">Update</a>
                              <button type="button" class="dropdown-item text-danger" data-toggle="modal" data-target="#deleteModal" data-id="${dataDb[i].id}" data-name="${dataDb[i].name}">
                                Delete
                              </button>
                            </div>
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


// Upload document
app.get("/upload", (req, res) => {
  try {
      res.render("upload.ejs", { message: req.flash("success")[0] || "", errorMessage: req.flash("error")[0] || "", });
  } catch(err) {
      console.log(err);
      res.status(500).send("Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.");
  }
})

app.post("/upload", upload.fields(UPLOAD_FIELDS),async (req, res) => {
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
      }
  
      await db.query("INSERT INTO upload_document (name, api_name, va_type, folder_name, created_at, updated_at, uploaded_files) VALUES ($1, $2, $3, $4, $5, $6, $7)", [institution, integration, vaType, folderName, date, date, JSON.stringify(uploadedDocuments)]);

      req.flash("success", "Dokumen berhasil diupload");
      return res.redirect("/");
  } catch(err) {
      console.log(err);
      res.status(500).send("Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.");
  }
});


// Read detaile document
app.get("/read_data", async (req, res) => {
  try {
    const id = req.query.id;

    if (typeof id === "undefined" || id === "") {
      return res.status(400).send("ID data tidak valid.");
      
    } else {
      const dataDb = (await db.query("SELECT * FROM upload_document WHERE id = $1", [id])).rows;
      const targetData = dataDb[0]; 

      if (!targetData) {
        return res.status(404).send("Data yang anda cari tidak ditemukan!.");
        
      } else {
        let uploaded_file = [];
        const dbFiles = targetData.uploaded_files || targetData.uploaded_files;
        if (dbFiles) {
          try {
            uploaded_file = typeof dbFiles === "string" ? JSON.parse(dbFiles) : dbFiles;
          } catch (err) {
            console.log("Gagal parse JSON dari DB, beralih ke pembacaan folder.");
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
                                  <input type="file" class="custom-file-input" name="${docName}" id="doc_${i}" accept=".pdf,.doc,.docx,.xls,.xlsx" style="cursor: pointer;" />
                                  <label class="custom-file-label text-truncate text-success" for="doc_${i}" id="label_doc_${i}" data-browse="🗙" style="padding-right: 50px; font-weight: 500;" >
                                    ${foundFileName}
                                  </label>
                                  <button type="button" 
                                      class="position-absolute h-100 d-flex align-items-center justify-content-center text-decoration-none text-secondary" 
                                      style="right: 0; top: 0; width: 42px; z-index: 10; background-color: #e9ecef; border-left: 1px solid #ced4da; border-radius: 0 0.25rem 0.25rem 0; font-size: 16px; cursor: pointer; border: none;"
                                      title="Hapus berkas ini"
                                      data-toggle="modal" 
                                      data-target="#modalDeleteConfirmation"
                                      data-id="${id}"
                                      data-filename="${foundFileName}">
                                        🗙
                                  </button>
                               </div>
                              <small class="form-text text-muted">Document has been saved, click <a href="/download_file?id=${id}&fileName=${foundFileName}" target="_blank" class="font-weight-bold text-primary"> here </a> to download this document.</small>`;
          } else {
            fields[docName] = `<div class="custom-file">
                                  <input type="file" class="custom-file-input" name="${docName}" id="doc_${i}" accept=".pdf,.doc,.docx,.xls,.xlsx">
                                  <label class="custom-file-label text-truncate text-muted" id="label_doc_${i}" for="doc_${i}" data-browse="🗀" style="padding-right: 50px;">Choose file</label>
                              </div>
                              <small class="form-text text-muted">File formats: PDF, DOCX, XLSX.</small>`;
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
          fields: fields
        };

        res.render("read_data.ejs", data);
      }
    }
  } catch (err) {
    console.error("Error pada rute read_data:", err);
    res.status(500).send("Terjadi kesalahan pada sistem.");
  }
});


// Delete file
app.get("/delete_file", async (req, res) => {
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
    return res.redirect(`/read_data?id=${id}`);
  } catch (err) {
    console.error("Error pada route delete_file:", err);

    if (err.code === "ENOENT") {
      return res.status(404).send("File fisik tidak ditemukan.");
    }

    res.status(500).send("Terjadi kesalahan pada sistem.");
  }
});



// Update decument
app.post("/update_data", upload.fields(UPLOAD_FIELDS), async (req, res) => {
  try {
    const id = req.query.id;
    if (!id || id === "") {
      return res.status(400).send("ID data tidak valid.");
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        req.flash("error", "Anda belum memilih dokumen baru untuk diperbarui!");
        return res.redirect(`/read_data?id=${id}`);
      }

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


// Download document
app.get("/download_file", async (req, res) => {
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

    if (!Array.isArray(uploadedFiles)) {
      return res.status(500).send("Data dokumen tidak valid.");
    }

    if (!uploadedFiles.includes(fileName)) {
      return res.status(404).send("Dokumen tidak terdaftar pada integrasi ini.");
    }

    const savedFolderName = targetData.folder_name;

    if (!savedFolderName || typeof savedFolderName !== "string" || savedFolderName !== path.basename(savedFolderName) || savedFolderName === "." || savedFolderName === "..")
    {
      return res.status(400).send("Nama folder penyimpanan tidak valid.");
    }

    const baseFolder = path.resolve(process.cwd(), "data", "uploaded_file");
    const absoluteFilePath = path.resolve(baseFolder, savedFolderName, fileName);

    const relativeFile = path.relative(baseFolder, absoluteFilePath);

    if (!relativeFile || relativeFile === ".." || relativeFile.startsWith(`..${path.sep}`) || path.isAbsolute(relativeFile))
    {
      return res.status(403).send("Akses unduhan dokumen ditolak.");
    }

    try {
      const fileStat = await fs.promises.stat(absoluteFilePath);

      if (!fileStat.isFile()) {
        return res.status(404).send("Berkas tidak ditemukan.");
      }

      return res.download(absoluteFilePath, fileName, (err) => {
        if (err) {
          console.error("Gagal mengunduh file:", err);

          if (!res.headersSent) {
            return res.status(500).send("Gagal mengunduh dokumen.");
          }
        }
      });

    } catch (err) {
      return res.status(404).send("Berkas fisik tidak ditemukan di dalam folder penyimpanan server.");
    }
  } catch (err) {
    console.error("Error pada download_file:", err);
    res.status(500).send("Terjadi kesalahan sistem saat memproses unduhan berkas.");
  }
});



// Delete integration
app.get("/delete", async (req, res) => {
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
        !relativeFolder ||
        relativeFolder.startsWith("..") ||
        path.isAbsolute(relativeFolder)
      ) {
        return res.status(403).send("Akses file ditolak.");
      }

      await fs.promises.rm(folderPath, { 
        recursive: true, 
        force: true 
      });

      await db.query("DELETE FROM upload_document WHERE id = $1", [id]);

      req.flash("success", "Mitra berhasil dihapus!");
      return res.redirect("/");
    }
  } catch(err) {
    console.error("Error pada route /delete:", err);
    res.status(500).send("Terjadi kesalahan sistem pada route /delete.");
  }
})

app.use((err, req, res, next) => {
  console.error('Upload error:', err);

  const isUpdateRequest = req.path === '/update_data';

  const redirectUrl =
    isUpdateRequest && req.query.id ? `/read_data?id=${encodeURIComponent(req.query.id)}` : '/upload';

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', 'Ukuran file terlalu besar! Maksimal dokumen adalah 2 MB.');
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      req.flash('error', 'Kolom unggah dokumen tidak dikenali atau jumlah file melebihi batas.');
    } else {
      req.flash('error', 'Terjadi kesalahan saat mengunggah dokumen.');
    }

    return res.redirect(redirectUrl);
  }

  if (err.message === 'Format file tidak valid! Hanya diperbolehkan PDF, Word, dan Excel.') {
    req.flash('error', 'Format file tidak didukung! Gunakan PDF, DOC, DOCX, XLS, atau XLSX.');

    return res.redirect(redirectUrl);
  }

  next(err);
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
