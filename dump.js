
<div class="py-2 px-0 w-100 overflow-visible">

    <% if (typeof successMessage !== 'undefined' && successMessage) { %>
        <div class="alert alert-success alert-dismissible fade show w-100 text-center mb-4 shadow-sm" role="alert">
            <strong><%= successMessage %></strong>

            <button type="button" class="close" data-dismiss="alert" aria-label="Close" style="outline: none;">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    <% } %>

    <% if (typeof errorMessage !== 'undefined' && errorMessage) { %>
        <div class="alert alert-danger alert-dismissible fade show w-100 text-center mb-4 shadow-sm" role="alert">
            <strong><%= errorMessage %></strong>

            <button type="button" class="close" data-dismiss="alert" aria-label="Close" style="outline: none;">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    <% } %>

</div>









return res.render("index.ejs", {
    tableRows: tableRows,
    successMessage: req.flash("success")[0] || "",
    errorMessage: req.flash("error")[0] || ""
});








router.get("/upload", checkAuth, (req, res) => {
    res.render("upload.ejs", {
        maxMB: MAX_MB,
        maxFiles: MAX_FILES,
        maxTotalMB: MAX_TOTAL_MB,
        successMessage: req.flash("success")[0] || "",
        errorMessage: req.flash("error")[0] || ""
    });
});








router.get("/upload", checkAuth, (req, res) => {
    res.render("upload.ejs", {
        maxMB: MAX_MB,
        maxFiles: MAX_FILES,
        maxTotalMB: MAX_TOTAL_MB,
        successMessage: req.flash("success")[0] || "",
        errorMessage: req.flash("error")[0] || ""
    });
});









return res.render("read_data.ejs", {
    integration,
    totalDocuments,
    totalSize,
    documentsHTML,
    paginationHTML,
    successMessage: req.flash("success")[0] || "",
    errorMessage: req.flash("error")[0] || ""
});








return res.render("update_data.ejs", {
    integration,
    totalDocuments: documents.length,
    documentsHTML,
    successMessage: req.flash("success")[0] || "",
    errorMessage: req.flash("error")[0] || "",
    maxMB: MAX_MB,
    maxFiles: MAX_FILES,
    maxTotalMB: MAX_TOTAL_MB
});








<div id="flashContainer">
    <%- include('./partials/alerts.ejs') %>
</div>





<%- include('./partials/alerts.ejs') %>





<%- include('./partials/alerts.ejs') %>











