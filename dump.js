SELECT *
FROM document_name
ORDER BY id;


SELECT
    id,
    name,
    api_name,
    va_type,
    folder_name,
    created_at,
    updated_at,
    uploaded_files
FROM upload_document
ORDER BY id DESC
LIMIT 5;



SELECT COUNT(*) AS total_integrasi
FROM upload_document;




SELECT COUNT(*) AS total_api
FROM document_name;
