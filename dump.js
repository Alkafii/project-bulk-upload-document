
import INTEGRATION_DOCUMENT from "./document/documentIntegration.js";
import ASPI_DOCUMENT from "./document/documentASPI.js";

import {
    VIRTUAL_ACCOUNT_OFF_US_DOCUMENT,
    VIRTUAL_ACCOUNT_ON_US_DOCUMENT
} from "./document/API/Virtual Account SNAP.js";

import QRIS_DOCUMENT from "./document/API/QRIS SNAP.js";
import UJI_FUNGSI_DOCUMENT from "./document/documentUjiFungsi.js";

// Konfigurasi tampilan form
const createDocumentFields = (documents, prefix, isApi = false) => {
    return documents.map((name, index) => ({
        name,
        id: `${prefix}_${index}`,
        label: isApi
            ? name.replace(/^\d+ - API /, "").replace(/ - /g, " · ")
            : name.replace(/_/g, " ")
    }));
};

export const DOCUMENT_FORM = {
    integration: createDocumentFields(
        INTEGRATION_DOCUMENT,
        "integration"
    ),

    aspi: createDocumentFields(
        ASPI_DOCUMENT,
        "aspi"
    ),

    devsite: {
        vaOff: createDocumentFields(
            VIRTUAL_ACCOUNT_OFF_US_DOCUMENT,
            "va_off",
            true
        ),

        vaOn: createDocumentFields(
            VIRTUAL_ACCOUNT_ON_US_DOCUMENT,
            "va_on",
            true
        ),

        qris: createDocumentFields(
            QRIS_DOCUMENT,
            "qris",
            true
        )
    },

    functionality: createDocumentFields(
        UJI_FUNGSI_DOCUMENT,
        "functionality"
    )
};

// Konfigurasi backend tetap dipertahankan
export const REQUIRED_DOCUMENTS = [
    ...INTEGRATION_DOCUMENT,
    ...ASPI_DOCUMENT,
    ...VIRTUAL_ACCOUNT_OFF_US_DOCUMENT,
    ...VIRTUAL_ACCOUNT_ON_US_DOCUMENT,
    ...QRIS_DOCUMENT,
    ...UJI_FUNGSI_DOCUMENT
];

export const UPLOAD_FIELDS = REQUIRED_DOCUMENTS.map(name => ({
    name,
    maxCount: 1
}));









