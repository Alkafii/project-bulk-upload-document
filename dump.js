<%- include('./partials/documentFields.ejs', {
    documents: documentForm.integration
}) %>




<%- include('./partials/documentFields.ejs', {
    documents: documentForm.aspi
}) %>




<div id="devsiteVAOff" style="display: none;">

    <h6 class="text-uppercase font-weight-bold text-primary mb-1">
        📋 Hasil Uji Developer Site VA SNAP Off Us (Pengguna Layanan)
    </h6>

    <hr class="mb-3">

    <%- include('./partials/documentFields.ejs', {
        documents: documentForm.devsite.vaOff
    }) %>

</div>





<div id="devsiteVAOn" style="display: none;">

    <h6 class="text-uppercase font-weight-bold text-primary mb-1">
        📋 Hasil Uji Developer Site VA SNAP On Us
    </h6>

    <hr class="mb-3">

    <%- include('./partials/documentFields.ejs', {
        documents: documentForm.devsite.vaOn
    }) %>

</div>






<div id="devsiteQRIS" style="display: none;">

    <h6 class="text-uppercase font-weight-bold text-primary mb-1">
        📋 Hasil Uji Developer Site QRIS MPM SNAP
    </h6>

    <hr class="mb-3">

    <%- include('./partials/documentFields.ejs', {
        documents: documentForm.devsite.qris
    }) %>

</div>




<%- include('./partials/documentFields.ejs', {
    documents: documentForm.functionality
}) %>

