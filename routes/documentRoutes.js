import express from "express";
import db from "../config/database.js";
import path from "path";

import {
  REQUIRED_DOCUMENTS,
  UPLOAD_FIELDS
} from "./../config/documentFields.js";

import { upload } from "../middleware/upload.js"

const router = express.Router();

// Homepage
router.get("/",async (req, res) => {
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
router.get("/upload", (req, res) => {
  try {
      res.render("upload.ejs", { message: req.flash("success")[0] || "", errorMessage: req.flash("error")[0] || "", });
  } catch(err) {
      console.log(err);
      res.status(500).send("Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.");
  }
})

router.post("/upload", upload.fields(UPLOAD_FIELDS),async (req, res) => {
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
router.get("/read_data", async (req, res) => {
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

export default router;