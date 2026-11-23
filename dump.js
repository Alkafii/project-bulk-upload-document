
<div class="form-row mb-3">
    <% documents.forEach((doc, index) => { %>
        <div class="form-group col-md-6 mb-3 <%= index % 2 === 0 ? 'pr-3' : 'pl-3' %>">

            <label><%= doc.label %></label>

            <%- fields[doc.name] %>

        </div>
    <% }) %>
</div>






res.render("update_data.ejs", {
    id: id,
    institution: targetData.name,
    integration: targetData.api_name,
    vaType: targetData.va_type,
    create_date: targetData.created_at
        ? targetData.created_at.toString().slice(0, 33)
        : "-",

    message: req.flash("success")[0] || "",
    errorMessage: req.flash("error")[0] || "",

    fields: fields,
    documentForm: DOCUMENT_FORM,

    maxMB: MAX_MB,
    maxFileSize: MAX_FILE_SIZE
});






<h6 class="text-uppercase font-weight-bold text-primary mb-1 mt-4">
    📋 Dokumen Integrasi
</h6>
<hr class="mb-3">

<%- include('./partials/updateDocumentFields.ejs', {
    documents: documentForm.integration,
    fields: fields
}) %>

<hr>
<p class="d-flex justify-content-end mb-0">
    <button class="btn btn-primary btn-step-nav"
        type="button"
        data-next="2"
        style="width: 100px;">
        Next
    </button>
</p>






<div id="sectionStep2" class="form-step-section">

    <h6 class="text-uppercase font-weight-bold text-primary mb-1">
        📁 Dokumen Verifikasi ASPI
    </h6>

    <hr class="mb-3">

    <%- include('./partials/updateDocumentFields.ejs', {
        documents: documentForm.aspi,
        fields: fields
    }) %>

    <hr>

    <p class="d-flex justify-content-between mb-0">
        <button class="btn btn-secondary btn-step-nav"
            type="button"
            data-prev="1"
            style="width: 100px;">
            Previous
        </button>

        <button class="btn btn-primary btn-step-nav"
            type="button"
            data-next="3"
            style="width: 100px;">
            Next
        </button>
    </p>

</div>






<!-- ================= LANGKAH 3: HASIL UJI DEVSITE ================= -->
<div id="sectionStep3" class="form-step-section">

    <% if (vaType === "Off Us") { %>

        <div>
            <h6 class="text-uppercase font-weight-bold text-primary mb-1">
                📋 Hasil Uji Developer Site VA SNAP Off Us (Pengguna Layanan)
            </h6>

            <hr class="mb-3">

            <%- include('./partials/updateDocumentFields.ejs', {
                documents: documentForm.devsite.vaOff,
                fields: fields
            }) %>
        </div>

    <% } %>


    <% if (vaType === "On Us") { %>

        <div>
            <h6 class="text-uppercase font-weight-bold text-primary mb-1">
                📋 Hasil Uji Developer Site VA SNAP On Us (Penyedia Layanan)
            </h6>

            <hr class="mb-3">

            <%- include('./partials/updateDocumentFields.ejs', {
                documents: documentForm.devsite.vaOn,
                fields: fields
            }) %>
        </div>

    <% } %>


    <% if (integration === "QRIS MPM SNAP") { %>

        <div>
            <h6 class="text-uppercase font-weight-bold text-primary mb-1">
                📋 Hasil Uji Developer Site QRIS MPM SNAP (Penyedia Layanan)
            </h6>

            <hr class="mb-3">

            <%- include('./partials/updateDocumentFields.ejs', {
                documents: documentForm.devsite.qris,
                fields: fields
            }) %>
        </div>

    <% } %>


    <hr>

    <p class="d-flex justify-content-between mb-0">

        <button class="btn btn-secondary btn-step-nav"
            type="button"
            data-prev="2"
            style="width: 100px;">
            Previous
        </button>

        <button class="btn btn-primary btn-step-nav"
            type="button"
            data-next="4"
            style="width: 100px;">
            Next
        </button>

    </p>

</div>






<!-- ================= LANGKAH 4: HASIL FUNGSIONALITAS ================= -->
<div id="sectionStep4" class="form-step-section">

    <h6 class="text-uppercase font-weight-bold text-primary mb-1">
        🗃️ Hasil Uji Fungsionalitas
    </h6>

    <hr class="mb-3">

    <%- include('./partials/updateDocumentFields.ejs', {
        documents: documentForm.functionality,
        fields: fields
    }) %>

    <hr>

    <div class="row no-gutters mb-3">
        <div class="col-12 d-flex justify-content-between">

            <button class="btn btn-secondary btn-step-nav"
                type="button"
                data-prev="3"
                style="width: 100px;">
                Previous
            </button>

            <button type="button"
                id="btnSaveTrigger"
                class="btn btn-success"
                style="width: 120px;">
                Save
            </button>

        </div>
    </div>

</div>

