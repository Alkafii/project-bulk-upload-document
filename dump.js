await client.query("COMMIT");

const successMessage = `Data integrasi berhasil ditambahkan. ${files.length} dokumen berhasil diunggah.`;

req.flash("success", successMessage);

// Jika request berasal dari fetch()
if (req.get("X-Requested-With") === "XMLHttpRequest") {
    return req.session.save(function (err) {
        if (err) {
            console.error("Gagal menyimpan session:", err);

            return res.status(500).json({
                success: false,
                message: "Data berhasil disimpan, tetapi gagal menyimpan notifikasi."
            });
        }

        return res.status(200).json({
            success: true,
            redirectUrl: "/"
        });
    });
}

// Jika request berasal dari form biasa
return res.redirect("/");







} catch (err) {
    if (client) {
        await client.query("ROLLBACK").catch(() => {});
    }

    if (folderName) {
        await fs.rm(folderPath, {
            recursive: true,
            force: true
        }).catch(() => {});
    }

    console.error("POST /upload error:", err);

    const errorMessage = err.message || "Gagal menyimpan dokumen.";

    if (req.get("X-Requested-With") === "XMLHttpRequest") {
        return res.status(400).json({
            success: false,
            message: errorMessage
        });
    }

    return flashError(req, res, errorMessage, "/upload");
}









try {
    const res = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
        throw new Error(result.message || "Upload gagal.");
    }

    // Redirect hanya setelah session berhasil disimpan
    window.location.assign(result.redirectUrl);

} catch (err) {
    triggerFlashError(err.message || "Terjadi kesalahan sistem pengunggahan.");

    isUploading = false;
    this.disabled = false;
    this.textContent = "Upload";

    $('#reviewModal').modal('hide');
    render();
}












