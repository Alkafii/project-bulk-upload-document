import db from "./database.js";

import INTEGRATION_DOCUMENT from "./document/integrationDocument.js";
import ASPI_DOCUMENT from "./document/aspiDocument.js";
import UJI_FUNGSI_DOCUMENT from "./document/ujiFungsiDocument.js";

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