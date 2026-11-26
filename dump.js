let successMessage = "Perubahan dokumen berhasil disimpan.";

if (deletedCount > 0) {
    successMessage = `${deletedCount} dokumen berhasil dihapus.`;
}

req.flash("success", successMessage);

// Simpan session sebelum browser melakukan navigasi
req.session.save(function (err) {
    if (err) {
        console.error("Gagal menyimpan session:", err);

        return res.status(500).json({
            message: "Dokumen berhasil diproses, tetapi gagal menyimpan pesan notifikasi."
        });
    }

    return res.status(200).json({
        success: true,
        redirectUrl: `/read_data?id=${id}`
    });
});












console.error("POST /update_data error:", err);

const errorMessage = err.message || "Gagal memperbarui dokumen.";

if (req.get("X-Requested-With") === "XMLHttpRequest") {
    return res.status(400).json({
        success: false,
        message: errorMessage
    });
}

return flashError(req, res, errorMessage, redirectUrl);









save.disabled = true;
save.textContent = "Menyimpan...";

fetch(form.action, {
    method: "POST",
    body: data,
    headers: {
        "X-Requested-With": "XMLHttpRequest"
    }
})
.then(async function (response) {
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan perubahan.");
    }

    if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
    }

    throw new Error("Respons server tidak valid.");
})
.catch(function (err) {
    alert(err.message);

    save.disabled = false;
    save.textContent = "Save";
});










