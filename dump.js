modal_confirm_delete.ejs
<div class="modal fade" id="<%= modalId %>" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 10px;">

            <div class="modal-header">
                <h5 class="modal-title font-weight-bold text-danger">
                    <%= modalTitle %>
                </h5>

                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body py-3">
                <p class="mb-2"><%= modalMessage %></p>

                <ul
                    id="<%= listId %>"
                    class="pl-4 font-weight-bold text-dark mb-0"
                    style="max-height: 180px; overflow-y: auto;"
                ></ul>
            </div>

            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-light font-weight-bold text-secondary"
                    data-dismiss="modal"
                >
                    Cancel
                </button>

                <a
                    href="#"
                    id="<%= confirmId %>"
                    class="btn btn-danger font-weight-bold"
                >
                    <%= confirmLabel %>
                </a>
            </div>

        </div>
    </div>
</div>




modal_review_documents.ejs

<div class="modal fade" id="reviewModal" tabindex="-1" role="dialog" aria-labelledby="reviewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 10px;">

            <div class="modal-header">
                <h5 class="modal-title font-weight-bold text-primary" id="reviewModalLabel">
                    Review Data
                </h5>

                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body py-3 d-flex flex-column" style="height: 530px;">

                <table class="table table-sm table-borderless mb-3 flex-shrink-0">
                    <tr>
                        <td class="font-weight-bold p-0" style="width: 150px;">Partner Name</td>
                        <td class="p-0" style="width: 20px;">:</td>
                        <td class="p-0" id="reviewPartner"></td>
                    </tr>

                    <tr>
                        <td class="font-weight-bold p-0">API Name</td>
                        <td class="p-0">:</td>
                        <td class="p-0" id="reviewApi"></td>
                    </tr>

                    <tr>
                        <td class="font-weight-bold p-0">Total Size</td>
                        <td class="p-0" style="width: 20px;">:</td>
                        <td class="p-0" id="reviewSize"></td>
                    </tr>
                </table>

                <h6 class="font-weight-bold text-secondary mt-2 mb-2 flex-shrink-0">
                    <span id="reviewDocCount"></span>
                    Documents to be processed:
                </h6>

                <div class="card border rounded-lg flex-fill overflow-auto mb-3">
                    <ul class="list-group list-group-flush" id="reviewDocList"></ul>
                </div>

                <nav class="flex-shrink-0">
                    <ul class="pagination pagination-sm justify-content-center mb-0" id="reviewPaginationControls"></ul>
                </nav>

            </div>

            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-light font-weight-bold text-secondary"
                    data-dismiss="modal"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    id="confirmSubmitBtn"
                    class="btn btn-primary font-weight-bold"
                >
                    Confirm
                </button>
            </div>

        </div>
    </div>
</div>





<%- include('./partials/modal_confirm_delete.ejs', {
    modalId: 'deleteModal',
    modalTitle: 'Delete Confirmation',
    modalMessage: 'Confirm to delete the following integration documents?',
    listId: 'selectedItemsList',
    confirmId: 'confirmDeleteBtn',
    confirmLabel: 'Delete'
}) %>




<%- include('./partials/modal_review_documents.ejs') %>





<%- include('./partials/modal_confirm_delete.ejs', {
    modalId: 'deleteDocumentsModal',
    modalTitle: 'Delete Document Confirmation',
    modalMessage: 'Are you sure you want to delete the following documents?',
    listId: 'deleteDocumentsList',
    confirmId: 'confirmDeleteDocumentsBtn',
    confirmLabel: 'Confirm Delete'
}) %>



<%- include('./partials/modal_review_documents.ejs') %>






function renderModalDocuments() {
    const docList = $("#reviewDocList").empty();
    const controls = $("#reviewPaginationControls").empty();

    const reviewItems = [];

    // Dokumen baru
    for (const item of added) {
        reviewItems.push({
            name: item.name,
            size: item.file.size
        });
    }

    // Dokumen pengganti
    const replacements = Array.from(
        document.querySelectorAll(".replacement-file")
    ).filter(fileInput => fileInput.files.length > 0);

    for (const fileInput of replacements) {
        const file = fileInput.files[0];

        reviewItems.push({
            name: file.name,
            size: file.size
        });
    }

    $("#reviewDocCount").text(reviewItems.length);

    let totalSize = 0;

    for (const item of reviewItems) {
        totalSize += item.size;
    }

    $("#reviewSize").text(fmt(totalSize));

    const totalPages = Math.ceil(reviewItems.length / 10);
    const startIndex = (currentMainPage - 1) * 10;

    const currentItems = reviewItems.slice(
        startIndex,
        startIndex + 10
    );

    for (let i = 0; i < currentItems.length; i++) {
        const item = currentItems[i];

        const row = $("<li>").addClass(
            "list-group-item d-flex align-items-center py-2"
        );

        $("<span>")
            .addClass("text-muted mr-3 font-weight-bold")
            .text((startIndex + i + 1) + ".")
            .appendTo(row);

        $("<span>")
            .addClass("text-primary mr-2")
            .text("📄")
            .appendTo(row);

        $("<span>")
            .addClass("text-truncate font-weight-medium")
            .text(item.name)
            .appendTo(row);

        docList.append(row);
    }

    if (totalPages > 1) {
        for (let page = 1; page <= totalPages; page++) {
            const pageButton = $("<a>")
                .attr("href", "#")
                .addClass("page-link")
                .text(page);

            const pageItem = $("<li>")
                .addClass("page-item");

            if (page === currentMainPage) {
                pageItem.addClass("active");
            }

            pageItem.append(pageButton);

            pageButton.on("click", function (event) {
                event.preventDefault();
                currentMainPage = page;
                renderModalDocuments();
            });

            controls.append(pageItem);
        }
    }
}








let currentDeleteIds = [];
let currentReplacements = [];

function submitUpdateData() {
    const data = new FormData(form);

    data.delete("newDocuments");
    data.delete("newDocumentNames");
    data.delete("replacementDocumentIds");

    // Tambahkan dokumen baru
    for (const item of added) {
        data.append("newDocuments", item.file, item.file.name);
        data.append("newDocumentNames", item.name.trim());
    }

    // Tambahkan ID dokumen yang diganti
    for (const fileInput of currentReplacements) {
        data.append(
            "replacementDocumentIds",
            fileInput.dataset.id
        );
    }

    save.disabled = true;
    save.textContent = "Saving...";

    fetch(form.action, {
        method: "POST",
        body: data,
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(async function (response) {
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Gagal menyimpan perubahan."
            );
        }

        if (result.success && result.redirectUrl) {
            window.location.href = result.redirectUrl;
            return;
        }

        throw new Error("Respons server tidak valid.");
    })
    .catch(function (err) {
        alert(err.message);

        save.disabled = false;
        save.textContent = "Save";
    });
}

function showReviewModal() {
    currentMainPage = 1;

    $("#reviewPartner").text(
        form.querySelector('[name="institutionName"]').value.trim()
    );

    $("#reviewApi").text(
        form.querySelector('[name="integrationType"]').value.trim()
    );

    renderModalDocuments();

    $("#reviewModal").modal("show");
}

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const replacements = Array.from(
        document.querySelectorAll(".replacement-file")
    ).filter(fileInput => fileInput.files.length > 0);

    const deletes = Array.from(
        document.querySelectorAll(".delete-doc:checked")
    );

    const deleteIds = deletes.map(item => item.value);

    // Validasi konflik hapus dan ganti
    if (replacements.some(fileInput => deleteIds.includes(fileInput.dataset.id))) {
        alert("Dokumen yang sama tidak bisa dihapus dan diganti sekaligus.");
        return;
    }

    if (replacements.length + added.length > maxFiles) {
        alert("Maksimal " + maxFiles + " file perubahan per proses.");
        return;
    }

    if (added.some(item => !item.name.trim())) {
        alert("Nama dokumen baru tidak boleh kosong.");
        return;
    }

    const totalSize =
        getAddedTotalSize() +
        replacements.reduce(function (sum, fileInput) {
            return sum + fileInput.files[0].size;
        }, 0);

    if (totalSize > maxTotal) {
        alert("Total ukuran file melebihi batas.");
        return;
    }

    if (replacements.some(fileInput => fileInput.files[0].size > maxFile)) {
        alert("Ukuran salah satu file pengganti melebihi batas.");
        return;
    }

    currentDeleteIds = deleteIds;
    currentReplacements = replacements;

    // Jika ada dokumen yang akan dihapus
    if (deletes.length > 0) {
        const deleteList = $("#deleteDocumentsList").empty();

        for (const checkbox of deletes) {
            const docRow = checkbox.closest(".main-doc-item");
            const docName = docRow.querySelector(".font-weight-bold").textContent.trim();

            $("<li>")
                .text(docName)
                .appendTo(deleteList);
        }

        $("#deleteDocumentsModal").modal("show");
        return;
    }

    // Jika ada dokumen baru atau pengganti
    if (added.length > 0 || replacements.length > 0) {
        showReviewModal();
        return;
    }

    // Jika hanya mengubah Partner Name atau API Name
    submitUpdateData();
});

// Konfirmasi penghapusan
$("#confirmDeleteDocumentsBtn").on("click", function (event) {
    event.preventDefault();

    $("#deleteDocumentsModal").modal("hide");

    // Jika ada dokumen baru atau pengganti, tampilkan review berikutnya
    if (added.length > 0 || currentReplacements.length > 0) {
        showReviewModal();
        return;
    }

    submitUpdateData();
});

// Konfirmasi penambahan/pergantian dokumen
$("#confirmSubmitBtn").on("click", function () {
    $("#reviewModal").modal("hide");

    submitUpdateData();
});











