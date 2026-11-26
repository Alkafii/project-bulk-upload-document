for (const checkbox of deletes) {
    const docRow = checkbox.closest(".main-doc-item");

    const nameElement = docRow.querySelector(".document-name");

    let docName = "Nama dokumen tidak ditemukan";

    if (nameElement) {
        docName = nameElement.textContent.trim();
    }

    $("<li>")
        .text(docName)
        .appendTo(deleteList);
}







<style>
    #reviewModal .modal-content {
        border: 0;
        border-radius: 16px;
        overflow: hidden;
    }

    #reviewModal .modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #edf0f4;
    }

    #reviewModal .modal-body {
        padding: 22px 24px;
        max-height: 75vh;
        overflow-y: auto;
    }

    #reviewModal .review-info {
        background: #f8faff;
        border: 1px solid #e8eef8;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 18px;
    }

    #reviewModal .review-info-label {
        color: #718096;
        font-size: 12px;
        margin-bottom: 4px;
    }

    #reviewModal .review-info-value {
        color: #26364a;
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    #reviewModal .review-stat {
        background: #f8faff;
        border: 1px solid #e8eef8;
        border-radius: 10px;
        padding: 12px 15px;
        height: 100%;
    }

    #reviewModal .review-stat-label {
        color: #718096;
        font-size: 12px;
        margin-bottom: 4px;
    }

    #reviewModal .review-stat-value {
        color: #2563eb;
        font-size: 19px;
        font-weight: 700;
    }

    #reviewModal .review-list {
        border: 1px solid #e5eaf1;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 0;
    }

    #reviewModal .review-item {
        display: flex;
        align-items: flex-start;
        padding: 12px 15px;
        border-bottom: 1px solid #edf0f4;
        background: #fff;
    }

    #reviewModal .review-item:last-child {
        border-bottom: 0;
    }

    #reviewModal .review-number {
        width: 27px;
        height: 27px;
        min-width: 27px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 7px;
        background: #edf4ff;
        color: #2563eb;
        font-size: 12px;
        font-weight: 700;
        margin-right: 12px;
    }

    #reviewModal .review-document-name {
        font-size: 14px;
        font-weight: 700;
        color: #26364a;
        overflow-wrap: anywhere;
    }

    #reviewModal .review-file-name {
        font-size: 12px;
        color: #718096;
        overflow-wrap: anywhere;
        margin-top: 3px;
    }

    #reviewModal .review-item-meta {
        font-size: 11px;
        color: #718096;
        margin-top: 5px;
    }

    #reviewModal .review-type {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 20px;
        background: #edf4ff;
        color: #2563eb;
        white-space: nowrap;
    }

    #reviewModal .review-type.replacement {
        background: #fff5e8;
        color: #b7791f;
    }

    #reviewModal .review-pagination {
        margin-top: 16px;
    }

    #reviewModal .modal-footer {
        padding: 15px 24px;
        border-top: 1px solid #edf0f4;
    }

    @media (max-width: 576px) {
        #reviewModal .modal-dialog {
            margin: 10px;
        }

        #reviewModal .modal-header {
            padding: 16px;
        }

        #reviewModal .modal-body {
            padding: 16px;
            max-height: 75vh;
        }

        #reviewModal .modal-footer {
            padding: 12px 16px;
        }

        #reviewModal .review-item {
            padding: 11px;
        }

        #reviewModal .review-type {
            margin-top: 7px;
        }
    }
</style>

<div class="modal fade" id="reviewModal"
     tabindex="-1" role="dialog"
     aria-labelledby="reviewModalLabel"
     aria-hidden="true">

    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content shadow-lg">

            <div class="modal-header">
                <div>
                    <h5 class="modal-title font-weight-bold text-primary mb-1"
                        id="reviewModalLabel">
                        Review Dokumen
                    </h5>

                    <small class="text-muted">
                        Periksa kembali dokumen sebelum menyimpan perubahan.
                    </small>
                </div>

                <button type="button" class="close"
                        data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body">

                <div class="review-info">
                    <div class="row">
                        <div class="col-md-6 mb-3 mb-md-0">
                            <div class="review-info-label">Partner Name</div>
                            <div class="review-info-value" id="reviewPartner">-</div>
                        </div>

                        <div class="col-md-6">
                            <div class="review-info-label">API Name</div>
                            <div class="review-info-value" id="reviewApi">-</div>
                        </div>
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-6">
                        <div class="review-stat">
                            <div class="review-stat-label">Total Dokumen</div>
                            <div class="review-stat-value">
                                <span id="reviewDocCount">0</span>
                                <small style="font-size: 12px; color: #718096;">
                                    file
                                </small>
                            </div>
                        </div>
                    </div>

                    <div class="col-6">
                        <div class="review-stat">
                            <div class="review-stat-label">Total Ukuran</div>
                            <div class="review-stat-value" id="reviewSize">
                                0 MB
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="font-weight-bold mb-0">
                        Daftar Dokumen
                    </h6>

                    <small class="text-muted" id="reviewPageInfo"></small>
                </div>

                <ul class="list-unstyled review-list" id="reviewDocList">
                </ul>

                <nav class="review-pagination" id="reviewPaginationContainer">
                    <ul class="pagination pagination-sm justify-content-center mb-0"
                        id="reviewPaginationControls">
                    </ul>
                </nav>

            </div>

            <div class="modal-footer">
                <button type="button"
                        class="btn btn-light font-weight-bold text-secondary"
                        data-dismiss="modal">
                    Cancel
                </button>

                <button type="button"
                        id="confirmSubmitBtn"
                        class="btn btn-primary font-weight-bold px-4">
                    Confirm
                </button>
            </div>

        </div>
    </div>
</div>






let added = [];
let currentMainPage = 1;
let currentReviewPage = 1;
let currentReplacements = [];

const mainItemsPerPage = 10;
const reviewItemsPerPage = 10;
const $docItems = $(".main-doc-item");








function renderModalDocuments() {
    const reviewDocList = $("#reviewDocList");
    const paginationControls = $("#reviewPaginationControls");

    reviewDocList.empty();
    paginationControls.empty();

    let reviewDocuments = [];
    let totalSize = 0;

    // 1. Ambil dokumen baru
    for (const item of added) {
        reviewDocuments.push({
            name: item.name,
            fileName: item.file.name,
            size: item.file.size,
            type: "Dokumen Baru"
        });

        totalSize += item.file.size;
    }

    // 2. Ambil dokumen pengganti
    const replacementInputs = document.querySelectorAll(".replacement-file");

    for (const fileInput of replacementInputs) {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const docRow = fileInput.closest(".main-doc-item");

            let documentName = "Dokumen";

            if (docRow) {
                const nameElement = docRow.querySelector(".document-name");

                if (nameElement) {
                    documentName = nameElement.textContent.trim();
                }
            }

            reviewDocuments.push({
                name: documentName,
                fileName: file.name,
                size: file.size,
                type: "Penggantian Dokumen"
            });

            totalSize += file.size;
        }
    }

    // 3. Tampilkan ringkasan
    $("#reviewDocCount").text(reviewDocuments.length);
    $("#reviewSize").text(fmt(totalSize));

    // 4. Jika tidak ada dokumen
    if (reviewDocuments.length === 0) {
        const emptyItem = $("<li>")
            .addClass("text-center text-muted p-4")
            .text("Tidak ada dokumen untuk diproses.");

        reviewDocList.append(emptyItem);
        $("#reviewPageInfo").text("");
        $("#reviewPaginationContainer").hide();

        return;
    }

    // 5. Hitung pagination
    const totalPages = Math.ceil(
        reviewDocuments.length / reviewItemsPerPage
    );

    if (currentReviewPage > totalPages) {
        currentReviewPage = totalPages;
    }

    if (currentReviewPage < 1) {
        currentReviewPage = 1;
    }

    const startIndex = (currentReviewPage - 1) * reviewItemsPerPage;
    const endIndex = startIndex + reviewItemsPerPage;

    const visibleDocuments = reviewDocuments.slice(startIndex, endIndex);

    // 6. Tampilkan informasi halaman
    $("#reviewPageInfo").text(
        "Menampilkan " +
        (startIndex + 1) +
        "-" +
        Math.min(endIndex, reviewDocuments.length) +
        " dari " +
        reviewDocuments.length +
        " dokumen"
    );

    // 7. Tampilkan dokumen
    for (let i = 0; i < visibleDocuments.length; i++) {
        const documentData = visibleDocuments[i];
        const documentNumber = startIndex + i + 1;

        const listItem = $("<li>").addClass("review-item");

        const number = $("<div>")
            .addClass("review-number")
            .text(documentNumber);

        const content = $("<div>")
            .addClass("flex-fill");

        const documentName = $("<div>")
            .addClass("review-document-name")
            .text(documentData.name);

        const fileName = $("<div>")
            .addClass("review-file-name")
            .text(documentData.fileName);

        const metadata = $("<div>")
            .addClass("review-item-meta")
            .text(fmt(documentData.size));

        const type = $("<span>")
            .addClass("review-type");

        if (documentData.type === "Penggantian Dokumen") {
            type.addClass("replacement");
        }

        type.text(documentData.type);

        content.append(documentName);
        content.append(fileName);
        content.append(metadata);

        const rightContent = $("<div>")
            .addClass("ml-3 text-right");

        rightContent.append(type);

        listItem.append(number);
        listItem.append(content);
        listItem.append(rightContent);

        reviewDocList.append(listItem);
    }

    // 8. Pagination hanya muncul jika lebih dari 10 dokumen
    if (totalPages <= 1) {
        $("#reviewPaginationContainer").hide();
        return;
    }

    $("#reviewPaginationContainer").show();

    // Tombol Previous
    const previousItem = $("<li>")
        .addClass("page-item");

    const previousButton = $("<a>")
        .addClass("page-link")
        .attr("href", "#")
        .text("Previous");

    if (currentReviewPage === 1) {
        previousItem.addClass("disabled");
    }

    previousButton.on("click", function (event) {
        event.preventDefault();

        if (currentReviewPage > 1) {
            currentReviewPage--;
            renderModalDocuments();
        }
    });

    previousItem.append(previousButton);
    paginationControls.append(previousItem);

    // Nomor halaman
    for (let page = 1; page <= totalPages; page++) {
        const pageItem = $("<li>")
            .addClass("page-item");

        const pageButton = $("<a>")
            .addClass("page-link")
            .attr("href", "#")
            .text(page);

        if (page === currentReviewPage) {
            pageItem.addClass("active");
        }

        pageButton.on("click", function (event) {
            event.preventDefault();

            currentReviewPage = page;
            renderModalDocuments();
        });

        pageItem.append(pageButton);
        paginationControls.append(pageItem);
    }

    // Tombol Next
    const nextItem = $("<li>")
        .addClass("page-item");

    const nextButton = $("<a>")
        .addClass("page-link")
        .attr("href", "#")
        .text("Next");

    if (currentReviewPage === totalPages) {
        nextItem.addClass("disabled");
    }

    nextButton.on("click", function (event) {
        event.preventDefault();

        if (currentReviewPage < totalPages) {
            currentReviewPage++;
            renderModalDocuments();
        }
    });

    nextItem.append(nextButton);
    paginationControls.append(nextItem);
}






function showReviewModal() {
    currentReviewPage = 1;

    $("#reviewPartner").text(
        form.querySelector('[name="institutionName"]').value.trim()
    );

    $("#reviewApi").text(
        form.querySelector('[name="integrationType"]').value.trim()
    );

    renderModalDocuments();

    $("#reviewModal").modal("show");
}













