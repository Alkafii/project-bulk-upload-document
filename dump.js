l
<%
    let initialAlertMessage = "";
    let initialAlertType = "";

    if (typeof successMessage !== "undefined" && successMessage) {
        initialAlertMessage = successMessage;
        initialAlertType = "success";
    } else if (typeof errorMessage !== "undefined" && errorMessage) {
        initialAlertMessage = errorMessage;
        initialAlertType = "error";
    }
%>

<div class="py-2 px-0 w-100 overflow-visible">
    <div
        id="alertMessage"
        data-message="<%= initialAlertMessage %>"
        data-type="<%= initialAlertType %>"
        class="alert alert-dismissible fade show w-100 text-center mb-4 shadow-sm d-none"
        role="alert"
        aria-live="polite"
    >
        <strong id="alertText"></strong>

        <button
            type="button"
            class="close"
            id="closeAlert"
            aria-label="Close"
        >
            <span aria-hidden="true">&times;</span>
        </button>
    </div>
</div>







const alertMessage = document.getElementById("alertMessage");
const alertText = document.getElementById("alertText");
const closeAlert = document.getElementById("closeAlert");

function showAlertMessage(message, type) {
    alertText.textContent = message;

    alertMessage.classList.remove(
        "d-none",
        "alert-success",
        "alert-danger"
    );

    if (type === "success") {
        alertMessage.classList.add("alert-success");
    } else {
        alertMessage.classList.add("alert-danger");
    }

    alertMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function hideAlertMessage() {
    alertMessage.classList.add("d-none");
    alertText.textContent = "";
}

closeAlert.addEventListener("click", hideAlertMessage);

// Menampilkan pesan dari server jika tersedia.
const initialMessage = alertMessage.dataset.message;
const initialType = alertMessage.dataset.type;

if (initialMessage) {
    showAlertMessage(initialMessage, initialType);
}







.catch(function(error) {
    showAlertMessage(error.message, "error");

    update.disabled = false;
    update.textContent = "Update";

    save.disabled = false;
    save.textContent = "Save";
});







showAlertMessage(
    "Dokumen yang sama tidak bisa dihapus dan diganti sekaligus.",
    "error"
);







const successMessage = req.flash("success")[0] || "";
const errorMessage = req.flash("error")[0] || "";

return res.render("update_data.ejs", {
    integration,
    totalDocuments: documents.length,
    documentsHTML,
    successMessage,
    errorMessage,
    maxMB: MAX_MB,
    maxFiles: MAX_FILES,
    maxTotalMB: MAX_TOTAL_MB
});
