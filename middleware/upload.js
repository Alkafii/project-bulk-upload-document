import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import db from "./../config/database.js";

// Multer config
const targetLocation = "./data/uploaded_file";
// let sessionMessage = "";

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      if (!req.customFolderPath) {
        const id = req.query.id;

        if (id) {
          const dataDb = (await db.query("SELECT folder_name FROM upload_document WHERE id = $1", [id])).rows;
          if (dataDb.length > 0 && dataDb[0].folder_name) {
            req.customFolderPath = path.join(targetLocation, dataDb[0].folder_name);
          }
        }

        if (!req.customFolderPath) {
          const institution = req.body.institutionName || "Unknown";
          const integration = req.body.integrationType || "General";
          const vaType = req.body.vaType || " ";
          const nanoId = nanoid(10);

          const customFolderName = `${institution}-${integration} ${vaType}-${nanoId}`;
          req.customFolderPath = path.join(targetLocation, customFolderName);
        }
      }

      if (!fs.existsSync(req.customFolderPath)) {
          fs.mkdirSync(req.customFolderPath, { recursive: true });
      }

      cb(null, req.customFolderPath);
    } catch(err) {
        console.log(err);
        cb(err);
    }  
  },
  filename: function (req, file, cb) {
    try {  
        const uniqueSuffix = Date.now();      
        const ext = path.extname(file.originalname);
        const newFileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
        
        const folderNameOnly = path.basename(req.customFolderPath);
        const databaseSavePath = `${folderNameOnly}/${newFileName}`;
        
        if (!req.uploadedPaths) req.uploadedPaths = [];
        req.uploadedPaths.push(databaseSavePath);

        cb(null, newFileName);

    } catch(err) {
        console.log(err);
        cb(err);
    }
  }
});

// const upload = multer({ storage: storage });
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  const allowedExts = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true); // File diterima
  } else {
    cb(new Error("Format file tidak valid! Hanya diperbolehkan PDF, Word, dan Excel."), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

export {targetLocation, upload};