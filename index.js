import express from "express";
import bodyParser from "body-parser";
import multer from "multer";

import {
  sessionMiddleware, 
  flashMiddleware
} from "./middleware/session.js";

import documentRoutes from "./routes/documentRoutes.js";
import { MAX_MB } from "./config/uploadConfig.js";

const app = express();
const port = 3000;


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(sessionMiddleware);
app.use(flashMiddleware);

app.use(documentRoutes);


app.use((err, req, res, next) => {
  console.error('Upload error:', err);

  const isUpdateRequest = req.path === '/update_data';
  const maxMB = MAX_MB;

  const redirectUrl = isUpdateRequest && req.query.id ? `/read_data?id=${encodeURIComponent(req.query.id)}` : '/upload';

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', `Ukuran file terlalu besar! Maksimal dokumen adalah ${maxMB} MB.`);
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
