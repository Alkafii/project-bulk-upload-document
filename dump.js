
if (currentAction === "update") {
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
