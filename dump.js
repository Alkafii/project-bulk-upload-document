
<td class="text-center">
    <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        data-category="<%= group.name %>"
        data-name="<%= document.name %>"
        onclick="editDocument(this)">
        Edit
    </button>

    <form
        action="/document_names/delete"
        method="POST"
        class="d-inline"
        onsubmit="return confirm('Yakin ingin menghapus dokumen ini?')">

        <input type="hidden" name="category" value="<%= group.name %>">
        <input type="hidden" name="documentName" value="<%= document.name %>">

        <button type="submit" class="btn btn-sm btn-outline-danger">
            Delete
        </button>
    </form>
</td>









function editDocument(button) {
    const category = button.dataset.category;
    const oldName = button.dataset.name;

    const newName = prompt(
        "Masukkan nama dokumen baru:",
        oldName
    );

    if (newName === null) return;

    const cleanName = newName.trim();

    if (!cleanName) {
        alert("Nama dokumen tidak boleh kosong.");
        return;
    }

    if (cleanName === oldName) return;

    if (cleanName.length > 150) {
        alert("Nama dokumen maksimal 150 karakter.");
        return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/document_names/update";

    const fields = {
        category: category,
        oldDocumentName: oldName,
        newDocumentName: cleanName
    };

    Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}









router.post("/document_names/update", checkAuth, async (req, res) => {
    let client;

    try {
        const {
            category,
            oldDocumentName,
            newDocumentName
        } = req.body;

        const cleanCategory = category?.trim();
        const oldName = oldDocumentName?.trim();
        const newName = newDocumentName?.trim();

        if (!cleanCategory || !oldName || !newName || newName.length > 150) {
            req.flash("error", "Data perubahan dokumen tidak valid.");
            return res.redirect("/document_names");
        }

        if (oldName === newName) {
            req.flash("error", "Tidak ada perubahan nama dokumen.");
            return res.redirect("/document_names");
        }

        // Periksa bentrokan nama dengan seluruh konfigurasi field.
        const { requiredDocuments } = await getDocumentConfig();

        const duplicate = requiredDocuments.some(name =>
            name.toLowerCase() === newName.toLowerCase() &&
            name !== oldName
        );

        if (duplicate) {
            req.flash("error", "Nama dokumen sudah digunakan oleh field lain.");
            return res.redirect("/document_names");
        }

        client = await db.connect();
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT document_names,
                    pg_typeof(document_names)::text AS data_type
             FROM document_name
             WHERE name = $1
             FOR UPDATE`,
            [cleanCategory]
        );

        if (result.rows.length === 0) {
            throw new Error("CATEGORY_NOT_FOUND");
        }

        const target = result.rows[0];

        let documents = target.document_names || [];

        if (typeof documents === "string") {
            documents = JSON.parse(documents);
        }

        if (!Array.isArray(documents)) {
            throw new Error("INVALID_DOCUMENT_FORMAT");
        }

        const index = documents.findIndex(
            name => String(name).trim() === oldName
        );

        if (index === -1) {
            throw new Error("DOCUMENT_NOT_FOUND");
        }

        // Cegah perubahan nama jika dokumen sudah pernah diupload.
        const uploadedResult = await client.query(
            "SELECT uploaded_files FROM upload_document"
        );

        const alreadyUsed = uploadedResult.rows.some(row => {
            let files = row.uploaded_files || [];

            if (typeof files === "string") {
                files = JSON.parse(files);
            }

            return Array.isArray(files) &&
                files.some(file => file.startsWith(`${oldName}-`));
        });

        if (alreadyUsed) {
            throw new Error("DOCUMENT_ALREADY_USED");
        }

        documents[index] = newName;

        let updateValue;
        let castExpression = "$1";

        if (target.data_type === "jsonb") {
            updateValue = JSON.stringify(documents);
            castExpression = "$1::jsonb";
        } else if (target.data_type === "json") {
            updateValue = JSON.stringify(documents);
            castExpression = "$1::json";
        } else if (target.data_type === "text") {
            updateValue = JSON.stringify(documents);
        } else {
            updateValue = documents;
        }

        await client.query(
            `UPDATE document_name
             SET document_names = ${castExpression}
             WHERE name = $2`,
            [updateValue, cleanCategory]
        );

        await client.query("COMMIT");

        req.flash("success", "Nama dokumen berhasil diperbarui!");
        return res.redirect("/document_names");

    } catch (err) {
        if (client) {
            await client.query("ROLLBACK").catch(console.error);
        }

        console.error("Error UPDATE document name:", err);

        const messages = {
            CATEGORY_NOT_FOUND: "Kategori dokumen tidak ditemukan.",
            DOCUMENT_NOT_FOUND: "Nama dokumen tidak ditemukan.",
            INVALID_DOCUMENT_FORMAT: "Format data dokumen tidak valid.",
            DOCUMENT_ALREADY_USED:
                "Nama tidak dapat diubah karena dokumen sudah pernah digunakan untuk upload."
        };

        req.flash(
            "error",
            messages[err.message] || "Gagal memperbarui nama dokumen."
        );

        return res.redirect("/document_names");

    } finally {
        if (client) client.release();
    }
});









router.post("/document_names/delete", checkAuth, async (req, res) => {
    let client;

    try {
        const category = req.body.category?.trim();
        const documentName = req.body.documentName?.trim();

        if (!category || !documentName) {
            req.flash("error", "Data dokumen tidak valid.");
            return res.redirect("/document_names");
        }

        client = await db.connect();
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT document_names,
                    pg_typeof(document_names)::text AS data_type
             FROM document_name
             WHERE name = $1
             FOR UPDATE`,
            [category]
        );

        if (result.rows.length === 0) {
            throw new Error("CATEGORY_NOT_FOUND");
        }

        const target = result.rows[0];

        let documents = target.document_names || [];

        if (typeof documents === "string") {
            documents = JSON.parse(documents);
        }

        if (!Array.isArray(documents)) {
            throw new Error("INVALID_DOCUMENT_FORMAT");
        }

        const exists = documents.some(
            name => String(name).trim() === documentName
        );

        if (!exists) {
            throw new Error("DOCUMENT_NOT_FOUND");
        }

        // Periksa apakah field sudah pernah digunakan untuk upload.
        const uploadedResult = await client.query(
            "SELECT uploaded_files FROM upload_document"
        );

        const alreadyUsed = uploadedResult.rows.some(row => {
            let files = row.uploaded_files || [];

            if (typeof files === "string") {
                files = JSON.parse(files);
            }

            return Array.isArray(files) &&
                files.some(file => file.startsWith(`${documentName}-`));
        });

        if (alreadyUsed) {
            throw new Error("DOCUMENT_ALREADY_USED");
        }

        const updatedDocuments = documents.filter(
            name => String(name).trim() !== documentName
        );

        let updateValue;
        let castExpression = "$1";

        if (target.data_type === "jsonb") {
            updateValue = JSON.stringify(updatedDocuments);
            castExpression = "$1::jsonb";
        } else if (target.data_type === "json") {
            updateValue = JSON.stringify(updatedDocuments);
            castExpression = "$1::json";
        } else if (target.data_type === "text") {
            updateValue = JSON.stringify(updatedDocuments);
        } else {
            updateValue = updatedDocuments;
        }

        await client.query(
            `UPDATE document_name
             SET document_names = ${castExpression}
             WHERE name = $2`,
            [updateValue, category]
        );

        await client.query("COMMIT");

        req.flash("success", "Nama dokumen berhasil dihapus!");
        return res.redirect("/document_names");

    } catch (err) {
        if (client) {
            await client.query("ROLLBACK").catch(console.error);
        }

        console.error("Error DELETE document name:", err);

        const messages = {
            CATEGORY_NOT_FOUND: "Kategori dokumen tidak ditemukan.",
            DOCUMENT_NOT_FOUND: "Nama dokumen tidak ditemukan.",
            INVALID_DOCUMENT_FORMAT: "Format data dokumen tidak valid.",
            DOCUMENT_ALREADY_USED:
                "Dokumen tidak dapat dihapus karena sudah pernah digunakan untuk upload."
        };

        req.flash(
            "error",
            messages[err.message] || "Gagal menghapus nama dokumen."
        );

        return res.redirect("/document_names");

    } finally {
        if (client) client.release();
    }
});


