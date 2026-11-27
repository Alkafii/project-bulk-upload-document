
if (currentAction === "update") {
    for (const fileInput of currentReplacements) {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const docRow = fileInput.closest(".main-doc-item");

            let documentName = "Dokumen";

            if (docRow) {
                const nameElement = docRow.querySelector(".document-name");

                if (nameElement) {
                    documentName = nameElement.textContent.trim();
                }
            }

            reviewDocuments.push({
                name: documentName,
                fileName: file.name,
                size: file.size,
                type: "Penggantian Dokumen"
            });

            totalSize += file.size;
        }
    }
}






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

    // Jika request berasal dari AJAX / Fetch
    if (req.get("X-Requested-With") === "XMLHttpRequest") {
        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }

    // Jika request biasa
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







