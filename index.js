import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import { sessionMiddleware, flashMiddleware } from "./middleware/session.js";
import documentRoutes from "./routes/routes.js";
import { MAX_MB, MAX_FILES, MAX_TOTAL_MB } from "./config/uploadConfig.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.json({ limit: "2mb" }));
app.use(sessionMiddleware);
app.use(flashMiddleware);
app.use(documentRoutes);

app.use((err, req, res, next) => {
  console.error("Application error:", err);

  let message = err.message || "Terjadi kesalahan pada server.";
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      message = `Ukuran setiap file maksimal ${MAX_MB} MB.`;
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = `Maksimal ${MAX_FILES} file dalam satu kali upload.`;
    } else {
      message = "Upload gagal. Periksa jumlah dan ukuran file.";
    }
  }

  if (req.flash) req.flash("error", message);
  if (res.headersSent) return next(err);

  const isUpdate = req.path === "/update_data";
  const redirect = isUpdate && req.query.id
    ? `/update_data?id=${encodeURIComponent(req.query.id)}`
    : "/upload";
  return res.redirect(redirect);
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
  console.log(`Batas total upload per proses: ${MAX_TOTAL_MB} MB`);
});
