import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import { sessionMiddleware, flashMiddleware } from "./middleware/session.js";
import documentRoutes from "./routes/routes.js";
import { MAX_MB, MAX_FILES } from "./config/uploadConfig.js";

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
    let statusCode = 500;

    if (err instanceof multer.MulterError) {
        statusCode = 400;

        if (err.code === "LIMIT_FILE_SIZE") {
            message = `Ukuran setiap file maksimal ${MAX_MB} MB.`;
        } else if (err.code === "LIMIT_FILE_COUNT") {
            message = `Maksimal ${MAX_FILES} file dalam satu kali upload.`;
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message = `Field upload tidak sesuai: ${err.field || "tidak diketahui"}.`;
        } else {
            message = "Upload gagal. Periksa jumlah dan ukuran file.";
        }
    }

    if (res.headersSent) {
        return next(err);
    }

    if (req.get("X-Requested-With") === "XMLHttpRequest") {
        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }

    if (req.flash) {
        req.flash("error", message);
    }

    const isUpdate = req.path === "/update_data";

    let redirect = "/upload";

    if (isUpdate && req.query.id) {
        redirect = `/update_data?id=${encodeURIComponent(req.query.id)}`;
    }

    return res.redirect(redirect);
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
