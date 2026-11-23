<button
    type="button"
    class="btn btn-sm btn-outline-secondary"
    data-toggle="modal"
    data-target="#modalEditDocument"
    data-category="<%= group.name %>"
    data-name="<%= document.name %>">
    Edit
</button>



<!-- Modal Edit Document -->
<div
    class="modal fade"
    id="modalEditDocument"
    tabindex="-1"
    role="dialog"
    aria-labelledby="labelEditDocument"
    aria-hidden="true">

    <div class="modal-dialog modal-dialog-centered" role="document">

        <form
            action="/document_names/update"
            method="POST"
            class="modal-content"
            id="formEditDocument">

            <!-- Modal Header -->
            <div class="modal-header">
                <div>
                    <h5 class="modal-title" id="labelEditDocument">
                        Edit Document Name
                    </h5>

                    <small class="text-muted">
                        Perbarui nama dokumen yang terdaftar.
                    </small>
                </div>

                <button
                    type="button"
                    class="close"
                    data-dismiss="modal"
                    aria-label="Close">

                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">

                <div class="form-group">
                    <label for="editDocumentCategory">
                        Document Category
                    </label>

                    <input
                        type="text"
                        class="form-control"
                        id="editDocumentCategory"
                        readonly>

                    <input
                        type="hidden"
                        name="category"
                        id="editCategory">
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
                        required>

                    <input
                        type="hidden"
                        name="oldDocumentName"
                        id="oldDocumentName">

                    <small class="form-text text-muted">
                        Nama dokumen maksimal 150 karakter.
                    </small>
                </div>

            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-light text-secondary"
                    data-dismiss="modal">
                    Cancel
                </button>

                <button
                    type="submit"
                    class="btn btn-primary"
                    id="btnSaveEditDocument">
                    Save Changes
                </button>
            </div>

        </form>
    </div>
</div>







$(document).ready(function () {

    // ==========================================
    // EDIT DOCUMENT MODAL
    // ==========================================

    $('#modalEditDocument').on('show.bs.modal', function (event) {

        const button = $(event.relatedTarget);

        const category = button.data('category');
        const documentName = button.data('name');

        // Isi informasi kategori
        $('#editDocumentCategory').val(category);
        $('#editCategory').val(category);

        // Isi nama dokumen lama
        $('#editDocumentName').val(documentName);
        $('#oldDocumentName').val(documentName);

    });


    // Fokus otomatis ke input nama setelah modal tampil
    $('#modalEditDocument').on('shown.bs.modal', function () {
        $('#editDocumentName').trigger('focus');
    });


    // ==========================================
    // VALIDASI FORM EDIT
    // ==========================================

    $('#formEditDocument').on('submit', function (event) {

        const oldName = $('#oldDocumentName').val().trim();
        const newName = $('#editDocumentName').val().trim();

        if (!newName) {
            event.preventDefault();

            alert('Nama dokumen tidak boleh kosong.');

            $('#editDocumentName').trigger('focus');

            return false;
        }

        if (newName.length > 150) {
            event.preventDefault();

            alert('Nama dokumen maksimal 150 karakter.');

            return false;
        }

        if (newName === oldName) {
            event.preventDefault();

            $('#modalEditDocument').modal('hide');

            return false;
        }

        return true;
    });


    // ==========================================
    // DELETE DOCUMENT MODAL
    // ==========================================

    $('.btn-trigger-delete').on('click', function () {

        const category = $(this).data('category');
        const documentName = $(this).data('document');

        $('#nama-berkas-modal').text(documentName);

        $('#modal-delete-category').val(category);
        $('#modal-delete-document').val(documentName);

    });

});







