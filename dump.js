if (deleteIds.length > 0) {
    const deleted = await client.query(
        `DELETE FROM uploaded_documents
         WHERE upload_document_id = $1
         AND id = ANY($2::bigint[])
         RETURNING stored_filename`,
        [id, deleteIds]
    );

    // Hitung jumlah dokumen yang benar-benar terhapus
    deletedCount = deleted.rows.length;

    // Simpan nama file untuk dihapus dari storage
    filesToDelete.push(
        ...deleted.rows.map(row => row.stored_filename)
    );
}





let successMessage = "Perubahan dokumen berhasil disimpan.";

if (deletedCount > 0) {
    successMessage = `${deletedCount} dokumen berhasil dihapus.`;
}

req.flash("success", successMessage);

return res.redirect(`/read_data?id=${id}`);