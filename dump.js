data.delete("deleteDocumentIds");
data.delete("replacementFiles");
data.delete("replacementDocumentIds");

// Save hanya menambahkan dokumen baru.
// Perubahan Partner Name dan API Name diproses melalui Update.
data.set("institutionName", originalInstitution);
data.set("integrationType", originalIntegration);

for (const item of added) {
    data.append(
        "newDocuments",
        item.file,
        item.file.name
    );

    data.append(
        "newDocumentNames",
        item.name.trim()
    );
}