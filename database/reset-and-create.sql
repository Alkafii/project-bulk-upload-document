-- PERHATIAN: Script ini menghapus data dummy pada struktur lama.
-- Jalankan hanya pada database development/test yang datanya memang boleh dihapus.

BEGIN;

-- Hapus tabel daftar nama dokumen lama (bukan lagi sumber field wajib).
DROP TABLE IF EXISTS document_name CASCADE;

-- Kolom lama tidak digunakan lagi; metadata file dipindahkan ke tabel anak.
ALTER TABLE upload_document
    DROP COLUMN IF EXISTS uploaded_files;

CREATE TABLE IF NOT EXISTS uploaded_documents (
    id BIGSERIAL PRIMARY KEY,
    upload_document_id INTEGER NOT NULL
        REFERENCES upload_document(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(150),
    file_size BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uploaded_documents_stored_unique
        UNIQUE (upload_document_id, stored_filename)
);

CREATE INDEX IF NOT EXISTS idx_uploaded_documents_integration
    ON uploaded_documents(upload_document_id);

COMMIT;
