const successMessage = req.flash("success")[0] || "";
const errorMessage = req.flash("error")[0] || "";

return res.render("index.ejs", {
    tableRows: tableRows,
    successMessage: successMessage,
    errorMessage: errorMessage
});