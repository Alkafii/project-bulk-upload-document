<div class="form-group">
    <label for="editDocumentCategory">Document Category</label>
    <input
        type="text"
        class="form-control"
        id="editDocumentCategory"
        readonly
    >
    <input
        type="hidden"
        name="category"
        id="editCategory"
    >
</div>

<div class="form-group mb-2">
    <label for="editDocumentName">
        Document Name <span class="text-danger">*</span>
    </label>

    <input
        type="text"
        class="form-control"
        id="editDocumentName"
        name="newDocumentName"
        placeholder="Enter document name"
        maxlength="150"
        required
    >

    <input
        type="hidden"
        name="oldDocumentName"
        id="oldDocumentName"
    >

    <small class="form-text text-muted">
        Nama dokumen maksimal 150 karakter.
    </small>
</div>




<form
    action="/document_names/update"
    method="POST"
    class="modal-content"
    id="formEditDocument"
>





$('#modalEditDocument').on('show.bs.modal', function (event) {
    const button = $(event.relatedTarget);

    const category = button.attr('data-category');
    const documentName = button.attr('data-name');

    $('#editDocumentCategory').val(category);
    $('#editCategory').val(category);

    $('#editDocumentName').val(documentName);
    $('#oldDocumentName').val(documentName);
});





console.log("DATA EDIT DOCUMENT:", req.body);


