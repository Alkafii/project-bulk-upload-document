import express from "express";
import db from "./../config/database.js";
import path from "path";

import { UPLOAD_FIELDS } from "./../config/documentFields.js";
import { upload } from "./../middleware/upload.js"

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

export default router;