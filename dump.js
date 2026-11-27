if (replacements.some(function(fileInput) {
    return deleteIds.includes(fileInput.dataset.id);
})) {
    showErrorMessage(
        "Dokumen yang sama tidak bisa dihapus dan diganti sekaligus."
    );

    return;
}




.catch(function(error) {
    showErrorMessage(error.message);

    update.disabled = false;
    update.textContent = "Update";

    save.disabled = false;
    save.textContent = "Save";
});

