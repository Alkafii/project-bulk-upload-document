// Validasi nama dokumen.
// Nama dokumen boleh sama, tetapi tidak boleh kosong.
for (const docName of documentNames) {
    if (!docName) {
        throw new Error(
            "Nama dokumen tidak boleh kosong."
        );
    }
}





SELECT
    conname,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'uploaded_documents'::regclass
AND contype = 'u';