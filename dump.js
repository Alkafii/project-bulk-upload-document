l<div class="d-flex justify-content-between align-items-center mt-4 flex-wrap">
    <nav>
        <ul class="pagination pagination-sm mb-0" id="mainPaginationControls"></ul>
    </nav>

    <button
        type="button"
        id="updateBtn"
        class="btn btn-warning btn-sm d-none mt-2 mt-md-0">
        Update
    </button>
</div>



<div class="d-flex justify-content-end mt-4 upload-actions">
    <a href="/read_data?id=<%= integration.id %>" class="btn btn-light mr-2">
        Cancel
    </a>

    <button
        type="button"
        id="saveBtn"
        class="btn btn-primary d-none">
        Save
    </button>
</div>




const form = document.getElementById('editForm');
const input = document.getElementById('newInput');

const drop = document.getElementById('dropzone');
const list = document.getElementById('newList');

const save = document.getElementById('saveBtn');
const update = document.getElementById('updateBtn');

const institutionInput = form.querySelector('[name="institutionName"]');
const integrationInput = form.querySelector('[name="integrationType"]');

const originalInstitution = institutionInput.value.trim();
const originalIntegration = integrationInput.value.trim();




function updateActionButtons() {

    // Periksa checkbox Delete
    const selectedDeletes = document.querySelectorAll(
        ".delete-doc:checked"
    );

    // Periksa file Replace
    const selectedReplacements = Array.from(
        document.querySelectorAll(".replacement-file")
    ).filter(function(fileInput) {
        return fileInput.files.length > 0;
    });

    // Periksa perubahan Partner Name dan API Name
    const partnerChanged =
        institutionInput.value.trim() !== originalInstitution;

    const apiChanged =
        integrationInput.value.trim() !== originalIntegration;

    // Update muncul jika ada perubahan dokumen lama atau informasi integrasi
    const hasUpdateChanges =
        selectedDeletes.length > 0 ||
        selectedReplacements.length > 0 ||
        partnerChanged ||
        apiChanged;

    if (hasUpdateChanges) {
        update.classList.remove("d-none");
    } else {
        update.classList.add("d-none");
    }

    // Save hanya muncul jika ada dokumen baru
    if (added.length > 0) {
        save.classList.remove("d-none");
    } else {
        save.classList.add("d-none");
    }
}




function render() {
    list.innerHTML = '';

    added.forEach((item, index) => {
        const row = document.createElement('div');

        row.className = 'doc-row';

        row.innerHTML = `
            <label class="small font-weight-bold">
                Nama dokumen
            </label>

            <div class="d-flex">
                <input
                    class="form-control form-control-sm mr-2"
                    maxlength="255"
                    value="${item.name}">

                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger">
                    Hapus
                </button>
            </div>

            <div class="small text-muted mt-1">
                ${item.file.name} · ${fmt(item.file.size)}
            </div>
        `;

        row.querySelector('input').addEventListener('input', function(event) {
            item.name = event.target.value;
        });

        row.querySelector('button').addEventListener('click', function() {
            added.splice(index, 1);
            render();
        });

        list.appendChild(row);
    });

    updateActionButtons();
}




// Perubahan checkbox Delete
$(form).on("change", ".delete-doc", function() {
    updateActionButtons();
});

// Perubahan file Replace
$(form).on("change", ".replacement-file", function() {
    const hidden = this.parentElement.querySelector('input[type="hidden"]');

    if (hidden) {
        hidden.disabled = !this.files.length;
    }

    const label = this.parentElement.querySelector('.custom-file-label');

    if (label) {
        if (this.files.length > 0) {
            label.textContent = this.files[0].name;
        } else {
            label.textContent = "Choose file or drag here...";
        }
    }

    updateActionButtons();
});

// Perubahan Partner Name dan API Name
institutionInput.addEventListener("input", updateActionButtons);
integrationInput.addEventListener("input", updateActionButtons);





function submitUpdateData(action) {

    const data = new FormData(form);

    // Hapus seluruh data dokumen baru dan ID penggantian
    // agar tidak ada data lama yang terkirim secara tidak sengaja.
    data.delete("newDocuments");
    data.delete("newDocumentNames");
    data.delete("replacementDocumentIds");

    if (action === "update") {

        // Update hanya memproses dokumen lama.
        // Dokumen baru tidak ikut dikirim.
        data.delete("newDocuments");
        data.delete("newDocumentNames");

        for (const fileInput of currentReplacements) {
            data.append(
                "replacementDocumentIds",
                fileInput.dataset.id
            );
        }

        update.disabled = true;
        update.textContent = "Updating...";

    } else if (action === "save") {

        // Save hanya memproses dokumen baru.
        // Hapus data Delete dan Replace dari FormData.
        data.delete("deleteDocumentIds");
        data.delete("replacementFiles");
        data.delete("replacementDocumentIds");

        for (const item of added) {
            data.append(
                "newDocuments",
                item.file,
                item.file.name
            );

            data.append(
                "newDocumentNames",
                item.name.trim()
            );
        }

        save.disabled = true;
        save.textContent = "Saving...";
    }

    fetch(form.action, {
        method: "POST",
        body: data,
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(async function(response) {
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
    .catch(function(error) {
        alert(error.message);

        update.disabled = false;
        update.textContent = "Update";

        save.disabled = false;
        save.textContent = "Save";
    });
}





let currentAction = "";

// Cegah form dikirim secara otomatis
form.addEventListener("submit", function(event) {
    event.preventDefault();
});


// ========================================
// PROSES UPDATE DOKUMEN LAMA
// ========================================

function startUpdate() {

    const replacements = Array.from(
        document.querySelectorAll(".replacement-file")
    ).filter(function(fileInput) {
        return fileInput.files.length > 0;
    });

    const deletes = Array.from(
        document.querySelectorAll(".delete-doc:checked")
    );

    const deleteIds = deletes.map(function(item) {
        return item.value;
    });

    // Cegah dokumen yang sama dihapus dan diganti
    if (replacements.some(function(fileInput) {
        return deleteIds.includes(fileInput.dataset.id);
    })) {
        alert("Dokumen yang sama tidak bisa dihapus dan diganti sekaligus.");
        return;
    }

    if (replacements.length > maxFiles) {
        alert("Maksimal " + maxFiles + " file pengganti.");
        return;
    }

    const replacementSize = replacements.reduce(
        function(total, fileInput) {
            return total + fileInput.files[0].size;
        },
        0
    );

    if (replacementSize > maxTotal) {
        alert("Total ukuran file pengganti melebihi batas.");
        return;
    }

    if (replacements.some(function(fileInput) {
        return fileInput.files[0].size > maxFile;
    })) {
        alert("Ukuran salah satu file pengganti melebihi batas.");
        return;
    }

    currentAction = "update";
    currentReplacements = replacements;

    // Jika ada dokumen yang akan dihapus
    if (deletes.length > 0) {

        const deleteList = $("#deleteDocumentsList").empty();

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

        $("#deleteDocumentsModal").modal("show");
        return;
    }

    // Jika hanya ada file pengganti
    if (replacements.length > 0) {
        showReviewModal();
        return;
    }

    // Jika hanya mengubah Partner Name atau API Name
    submitUpdateData("update");
}


// ========================================
// PROSES SAVE DOKUMEN BARU
// ========================================

function startSave() {

    if (added.length === 0) {
        return;
    }

    if (added.some(function(item) {
        return !item.name.trim();
    })) {
        alert("Nama dokumen baru tidak boleh kosong.");
        return;
    }

    if (added.length > maxFiles) {
        alert("Maksimal " + maxFiles + " dokumen baru.");
        return;
    }

    if (getAddedTotalSize() > maxTotal) {
        alert("Total ukuran dokumen baru melebihi batas.");
        return;
    }

    currentAction = "save";
    currentReplacements = [];

    showReviewModal();
}


// ========================================
// EVENT TOMBOL UPDATE DAN SAVE
// ========================================

update.addEventListener("click", function() {
    startUpdate();
});

save.addEventListener("click", function() {
    startSave();
});


// ========================================
// KONFIRMASI DELETE
// ========================================

$("#confirmDeleteDocumentsBtn").on("click", function(event) {

    event.preventDefault();

    $("#deleteDocumentsModal").modal("hide");

    // Setelah konfirmasi delete, periksa apakah ada file pengganti.
    if (currentAction === "update" && currentReplacements.length > 0) {
        showReviewModal();
        return;
    }

    submitUpdateData("update");
});


// ========================================
// KONFIRMASI REVIEW DOCUMENTS
// ========================================

$("#confirmSubmitBtn").on("click", function() {

    $("#reviewModal").modal("hide");

    submitUpdateData(currentAction);
});







// Tampilkan dokumen sesuai proses yang dipilih.

if (currentAction === "save") {

    // Hanya tampilkan dokumen baru
    for (const item of added) {
        reviewDocuments.push({
            name: item.name,
            fileName: item.file.name,
            size: item.file.size,
            type: "Dokumen Baru"
        });

        totalSize += item.file.size;
    }

} else if (currentAction === "update") {

    // Hanya tampilkan dokumen pengganti
    for (const fileInput of currentReplacements) {

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
}







