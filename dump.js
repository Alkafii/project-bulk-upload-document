
<div class="form-row mb-3">
    <% documents.forEach((doc, index) => { %>
        <div class="form-group col-md-6 mb-3 <%= index % 2 === 0 ? 'pr-3' : 'pl-3' %>">
            <label for="<%= doc.id %>"><%= doc.label %></label>

            <%- fields[doc.name] %>
        </div>
    <% }) %>
</div>




documentForm: DOCUMENT_FORM






<!-- DOKUMEN INTEGRASI -->
<h6 class="text-uppercase font-weight-bold text-primary mb-1 mt-5">
    📋 Dokumen Integrasi
</h6>
<hr class="mb-3">

<%- include('./partials/readDocumentFields.ejs', {
    documents: documentForm.integration,
    fields: fields
}) %>


<!-- DOKUMEN VERIFIKASI ASPI -->
<div class="mt-5">
    <h6 class="text-uppercase font-weight-bold text-primary mb-1">
        📁 Dokumen Verifikasi ASPI
    </h6>
    <hr class="mb-3">

    <%- include('./partials/readDocumentFields.ejs', {
        documents: documentForm.aspi,
        fields: fields
    }) %>
</div>


<!-- DOKUMEN DEVSITE -->
<div class="mt-4" id="openButton">

    <% if (vaType === "Off Us") { %>

        <div class="mt-5">
            <h6 class="text-uppercase font-weight-bold text-primary mb-1">
                📋 Hasil Uji Developer Site VA SNAP Off Us (Pengguna Layanan)
            </h6>
            <hr class="mb-3">

            <%- include('./partials/readDocumentFields.ejs', {
                documents: documentForm.devsite.vaOff,
                fields: fields
            }) %>
        </div>

    <% } %>


    <% if (vaType === "On Us") { %>

        <div class="mt-5">
            <h6 class="text-uppercase font-weight-bold text-primary mb-1">
                📋 Hasil Uji Developer Site VA SNAP On Us (Penyedia Layanan)
            </h6>
            <hr class="mb-3">

            <%- include('./partials/readDocumentFields.ejs', {
                documents: documentForm.devsite.vaOn,
                fields: fields
            }) %>
        </div>

    <% } %>


    <% if (integration === "QRIS MPM SNAP") { %>

        <div class="mt-5">
            <h6 class="text-uppercase font-weight-bold text-primary mb-1">
                📋 Hasil Uji Developer Site QRIS MPM SNAP (Penyedia Layanan)
            </h6>
            <hr class="mb-3">

            <%- include('./partials/readDocumentFields.ejs', {
                documents: documentForm.devsite.qris,
                fields: fields
            }) %>
        </div>

    <% } %>


    <!-- DOKUMEN FUNGSIONALITAS -->
    <h6 class="text-uppercase font-weight-bold text-primary mb-1 mt-5">
        🗃️ Hasil Uji Fungsionalitas
    </h6>
    <hr class="mb-3">

    <%- include('./partials/readDocumentFields.ejs', {
        documents: documentForm.functionality,
        fields: fields
    }) %>

</div>

