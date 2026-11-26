await client.query("COMMIT");

req.flash(
    "success",
    `Data integrasi berhasil ditambahkan. ${files.length} dokumen berhasil diunggah.`
);

return res.redirect("/");