
<div class="py-2 px-0 w-100 overflow-visible">

    <div
        id="alertMessage"
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

    <% if (typeof successMessage !== 'undefined' && successMessage) { %>
        <script>
            window.addEventListener("DOMContentLoaded", function() {
                showAlertMessage("<%= successMessage %>", "success");
            });
        </script>
    <% } %>

    <% if (typeof errorMessage !== 'undefined' && errorMessage) { %>
        <script>
            window.addEventListener("DOMContentLoaded", function() {
                showAlertMessage("<%= errorMessage %>", "error");
            });
        </script>
    <% } %>

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





showAlertMessage("Pesan error", "error");




showAlertMessage("Dokumen berhasil diperbarui.", "success");