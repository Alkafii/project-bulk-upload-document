import INTEGRATION_DOCUMENT from "./document/documentIntegration.js";
import ASPI_DOCUMENT from "./document/documentASPI.js";
import VA_OFF_US_DOCUMENT from "./document/documentVA-OffUs.js";
import VA_ON_US_DOCUMENT from "./document/documentVA-OnUs.js";
import QRIS_DOCUMENT from "./document/documentQRIS.js";
import UJI_FUNGSI_DOCUMENT from "./document/documentUjiFungsi.js";

export const REQUIRED_DOCUMENTS = [
          ...INTEGRATION_DOCUMENT, 

          ...ASPI_DOCUMENT,

          ...VA_OFF_US_DOCUMENT,

          ...VA_ON_US_DOCUMENT,

          ...QRIS_DOCUMENT,

          ...UJI_FUNGSI_DOCUMENT
        ];

export const UPLOAD_FIELDS = REQUIRED_DOCUMENTS.map( (name) => ({
    name, maxCount: 1
}));