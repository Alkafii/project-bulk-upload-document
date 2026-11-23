
import {
    REQUIRED_DOCUMENTS,
    UPLOAD_FIELDS,
    DOCUMENT_FORM
} from "../config/documentFields.js";




res.render("upload.ejs", {
    message: req.flash("success")[0] || "",
    errorMessage: req.flash("error")[0] || "",

    maxMB: MAX_MB,
    maxFileSize: MAX_FILE_SIZE,

    documentForm: DOCUMENT_FORM
});

