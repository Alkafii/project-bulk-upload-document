const documentTemplate = document.getElementById("documentListItemTemplate");



function render() {
    list.innerHTML = "";

    selected.forEach(function(item, index) {
        const row = documentTemplate.content.cloneNode(true);

        const label = row.querySelector("[data-document-label]");
        const nameInput = row.querySelector("[data-document-name]");
        const fileInfo = row.querySelector("[data-file-info]");
        const removeButton = row.querySelector("[data-remove-document]");

        label.textContent = "Document Name #" + (index + 1);

        nameInput.value = item.name;

        fileInfo.textContent =
            item.file.name + " · " + formatSize(item.file.size);

        nameInput.addEventListener("input", function() {
            item.name = this.value;
            checkDuplicates();
        });

        removeButton.addEventListener("click", function() {
            selected.splice(index, 1);
            render();
        });

        list.appendChild(row);
    });

    count.textContent =
        selected.length + " file · " + formatSize(getTotalSize());

    checkDuplicates();
}





const documentTemplate = document.getElementById("documentListItemTemplate");





function render() {
    list.innerHTML = "";

    added.forEach(function(item, index) {
        const row = documentTemplate.content.cloneNode(true);

        const label = row.querySelector("[data-document-label]");
        const nameInput = row.querySelector("[data-document-name]");
        const fileInfo = row.querySelector("[data-file-info]");
        const removeButton = row.querySelector("[data-remove-document]");

        label.textContent = "Document Name #" + (index + 1);

        nameInput.value = item.name;

        fileInfo.textContent =
            item.file.name + " · " +
            (item.file.size < 1048576
                ? (item.file.size / 1024).toFixed(1) + " KB"
                : (item.file.size / 1048576).toFixed(2) + " MB");

        nameInput.addEventListener("input", function() {
            item.name = this.value;
        });

        removeButton.addEventListener("click", function() {
            added.splice(index, 1);
            render();
        });

        list.appendChild(row);
    });

    updateActionButtons();
}










