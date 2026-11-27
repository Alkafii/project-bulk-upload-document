
<div class="py-2 px-0 w-100 overflow-visible">

    <% if (typeof successMessage !== 'undefined' && successMessage) { %>
        <div class="alert alert-success alert-dismissible fade show w-100 text-center mb-4 shadow-sm" role="alert">
            <strong><%= successMessage %></strong>

            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    <% } %>

    <% if (typeof errorMessage !== 'undefined' && errorMessage) { %>
        <div class="alert alert-danger alert-dismissible fade show w-100 text-center mb-4 shadow-sm" role="alert">
            <strong><%= errorMessage %></strong>

            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    <% } %>

    <!-- Dynamic Error Message -->
    <div
        id="dynamicErrorMessage"
        class="alert alert-danger alert-dismissible fade show w-100 text-center mb-4 shadow-sm d-none"
        role="alert"
        aria-live="assertive"
    >
        <strong id="dynamicErrorText"></strong>

        <button
            type="button"
            class="close"
            id="closeDynamicError"
            aria-label="Close"
        >
            <span aria-hidden="true">&times;</span>
        </button>
    </div>

</div>




const dynamicErrorMessage = document.getElementById("dynamicErrorMessage");
const dynamicErrorText = document.getElementById("dynamicErrorText");
const closeDynamicError = document.getElementById("closeDynamicError");

function showErrorMessage(message) {
    dynamicErrorText.textContent = message;

    dynamicErrorMessage.classList.remove("d-none");

    dynamicErrorMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function hideErrorMessage() {
    dynamicErrorMessage.classList.add("d-none");
    dynamicErrorText.textContent = "";
}

closeDynamicError.addEventListener("click", hideErrorMessage);





