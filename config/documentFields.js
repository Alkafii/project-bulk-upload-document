import INTEGRATION_DOCUMENT from "./document/documentIntegration.js";
import ASPI_DOCUMENT from "./document/documentASPI.js";

import {
    VIRTUAL_ACCOUNT_OFF_US_DOCUMENT,
    VIRTUAL_ACCOUNT_ON_US_DOCUMENT
} from "./document/API/Virtual Account SNAP.js";

import QRIS_DOCUMENT from "./document/API/QRIS SNAP.js";
import UJI_FUNGSI_DOCUMENT from "./document/documentUjiFungsi.js";

export const REQUIRED_DOCUMENTS = [
          ...INTEGRATION_DOCUMENT, 

          ...ASPI_DOCUMENT,

          ...VIRTUAL_ACCOUNT_OFF_US_DOCUMENT,

          ...VIRTUAL_ACCOUNT_ON_US_DOCUMENT,

          ...QRIS_DOCUMENT,

          ...UJI_FUNGSI_DOCUMENT
        ];

export const UPLOAD_FIELDS = REQUIRED_DOCUMENTS.map( (name) => ({
    name, maxCount: 1
}));