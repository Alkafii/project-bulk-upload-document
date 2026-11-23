
import db from "./database.js";

import INTEGRATION_DOCUMENT from "./document/integrationDocument.js";
import ASPI_DOCUMENT from "./document/aspiDocument.js";
import UJI_FUNGSI_DOCUMENT from "./document/ujiFungsiDocument.js";

// Mengubah data dari database menjadi array nama dokumen.
function normalizeDocuments(value) {
    if (Array.isArray(value)) {
        return value.map(item => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
                return parsed.map(item => String(item).trim()).filter(Boolean);
            }
        } catch {
            throw new Error("Format document_names pada database tidak valid.");
        }
    }

    return [];
}

function createDocumentFields(documents, prefix, isApi = false) {
    return documents.map((name, index) => ({
        name,
        id: `${prefix}_${index}`,
        label: isApi
            ? name.replace(/^\d+ - API /, "").replace(/ - /g, " · ")
            : name.replace(/_/g, " ")
    }));
}

// Dipanggil setiap request yang membutuhkan konfigurasi dokumen.
export async function getDocumentConfig() {
    const result = await db.query(
        `SELECT name, document_names
         FROM document_name
         WHERE name = ANY($1::text[])`,
        [[
            "VA SNAP Off Us",
            "VA SNAP On Us",
            "QRIS MPM SNAP"
        ]]
    );

    const documentsByCategory = {};

    for (const row of result.rows) {
        documentsByCategory[row.name] = normalizeDocuments(row.document_names);
    }

    const vaOff = documentsByCategory["VA SNAP Off Us"] || [];
    const vaOn = documentsByCategory["VA SNAP On Us"] || [];
    const qris = documentsByCategory["QRIS MPM SNAP"] || [];

    const documentForm = {
        integration: createDocumentFields(INTEGRATION_DOCUMENT, "integration"),
        aspi: createDocumentFields(ASPI_DOCUMENT, "aspi"),

        devsite: {
            vaOff: createDocumentFields(vaOff, "va_off", true),
            vaOn: createDocumentFields(vaOn, "va_on", true),
            qris: createDocumentFields(qris, "qris", true)
        },

        functionality: createDocumentFields(
            UJI_FUNGSI_DOCUMENT,
            "functionality"
        )
    };

    const requiredDocuments = [
        ...INTEGRATION_DOCUMENT,
        ...ASPI_DOCUMENT,
        ...vaOff,
        ...vaOn,
        ...qris,
        ...UJI_FUNGSI_DOCUMENT
    ];

    // Multer membutuhkan nama field yang unik.
    const uniqueDocuments = [...new Set(requiredDocuments)];

    if (uniqueDocuments.length !== requiredDocuments.length) {
        throw new Error("Ditemukan nama field dokumen yang duplikat.");
    }

    const uploadFields = uniqueDocuments.map(name => ({
        name,
        maxCount: 1
    }));

    return {
        documentForm,
        requiredDocuments: uniqueDocuments,
        uploadFields
    };
}








async function dynamicUploadFields(req, res, next) {
    try {
        const { uploadFields } = await getDocumentConfig();

        // Membuat konfigurasi Multer terbaru untuk request ini.
        upload.fields(uploadFields)(req, res, next);

    } catch (err) {
        next(err);
    }
}








router.get("/upload", checkAuth, async (req, res) => {
    try {
        const { documentForm } = await getDocumentConfig();

        res.render("upload.ejs", {
            message: req.flash("success")[0] || "",
            errorMessage: req.flash("error")[0] || "",

            maxMB: MAX_MB,
            maxFileSize: MAX_FILE_SIZE,

            documentForm
        });

    } catch (err) {
        console.error("Error GET /upload:", err);
        res.status(500).send(
            "Terjadi kesalahan saat mengambil konfigurasi dokumen."
        );
    }
});







const {
    documentForm,
    requiredDocuments
} = await getDocumentConfig();




for (let i = 0; i < requiredDocuments.length; i++) {
    const docName = requiredDocuments[i];
    
    
    
    
    
    const {
    documentForm,
    requiredDocuments
} = await getDocumentConfig();





for (let i = 0; i < requiredDocuments.length; i++) {
    const docName = requiredDocuments[i];
    
    
    
    
    
const { documentForm } = await getDocumentConfig();

const baseDocumentCount =
    documentForm.integration.length +
    documentForm.aspi.length +
    documentForm.functionality.length;
    
    
    
    
    
    
    
    
let targetDocument;

if (totalDocument.api_name === "QRIS MPM SNAP") {
    targetDocument = baseDocumentCount + documentForm.devsite.qris.length;
} else if (totalDocument.va_type === "Off Us") {
    targetDocument = baseDocumentCount + documentForm.devsite.vaOff.length;
} else {
    targetDocument = baseDocumentCount + documentForm.devsite.vaOn.length;
}












