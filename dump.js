router.get("/document_names", checkAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT name, document_names
            FROM document_name
            ORDER BY name ASC
        `);

        const documentGroups = result.rows.map(row => {
            let documents = row.document_names || [];

            // Antisipasi jika data dari database berbentuk JSON string.
            if (typeof documents === "string") {
                documents = JSON.parse(documents);
            }

            return {
                name: row.name,
                documents: documents.map(document => ({
                    name: document
                }))
            };
        });

        return res.render("add_document_name.ejs", {
            documentGroups,
            message: req.flash("success")[0] || "",
            errorMessage: req.flash("error")[0] || ""
        });

    } catch (err) {
        console.error("Error GET /document_names:", err);

        return res.status(500).send(
            "Terjadi kesalahan saat mengambil data dokumen."
        );
    }
});









router.post("/document_names", checkAuth, async (req, res) => {
    let client;

    try {
        const category = req.body.category;
        const documentName = req.body.documentName;

        const allowedCategories = [
            "Integration",
            "ASPI",
            "VA SNAP Off Us",
            "VA SNAP On Us",
            "QRIS MPM SNAP",
            "Functionality"
        ];

        // Validasi input
        if (
            typeof category !== "string" ||
            typeof documentName !== "string"
        ) {
            req.flash("error", "Data dokumen tidak valid.");
            return res.redirect("/document_names");
        }

        const cleanCategory = category.trim();
        const cleanDocumentName = documentName.trim();

        if (!allowedCategories.includes(cleanCategory)) {
            req.flash("error", "Kategori dokumen tidak valid.");
            return res.redirect("/document_names");
        }

        if (
            !cleanDocumentName ||
            cleanDocumentName.length > 150
        ) {
            req.flash(
                "error",
                "Nama dokumen wajib diisi dan maksimal 150 karakter."
            );

            return res.redirect("/document_names");
        }

        client = await db.connect();

        await client.query("BEGIN");

        // Ambil kategori dan kunci record selama transaksi.
        const result = await client.query(
            `SELECT
                document_names,
                pg_typeof(document_names)::text AS data_type
             FROM document_name
             WHERE name = $1
             FOR UPDATE`,
            [cleanCategory]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            req.flash("error", "Kategori dokumen tidak ditemukan.");
            return res.redirect("/document_names");
        }

        const targetData = result.rows[0];

        let documents = targetData.document_names || [];

        if (typeof documents === "string") {
            documents = JSON.parse(documents);
        }

        if (!Array.isArray(documents)) {
            throw new Error("INVALID_DOCUMENT_FORMAT");
        }

        // Validasi duplikasi tanpa membedakan huruf besar/kecil.
        const isDuplicate = documents.some(document =>
            String(document).trim().toLowerCase() ===
            cleanDocumentName.toLowerCase()
        );

        if (isDuplicate) {
            await client.query("ROLLBACK");

            req.flash("error", "Nama dokumen sudah terdaftar pada kategori ini.");
            return res.redirect("/document_names");
        }

        const updatedDocuments = [
            ...documents,
            cleanDocumentName
        ];

        // Mendukung kolom PostgreSQL JSON, JSONB, maupun array.
        let updateValue;
        let castExpression = "$1";

        if (targetData.data_type === "jsonb") {
            updateValue = JSON.stringify(updatedDocuments);
            castExpression = "$1::jsonb";
        } else if (targetData.data_type === "json") {
            updateValue = JSON.stringify(updatedDocuments);
            castExpression = "$1::json";
        } else if (targetData.data_type === "text") {
            updateValue = JSON.stringify(updatedDocuments);
        } else {
            updateValue = updatedDocuments;
        }

        await client.query(
            `UPDATE document_name
             SET document_names = ${castExpression}
             WHERE name = $2`,
            [updateValue, cleanCategory]
        );

        await client.query("COMMIT");

        req.flash("success", "Nama dokumen berhasil ditambahkan!");

        return res.redirect("/document_names");

    } catch (err) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback gagal:", rollbackError);
            }
        }

        console.error("Error POST /document_names:", err);

        if (err.message === "INVALID_DOCUMENT_FORMAT") {
            req.flash("error", "Format daftar dokumen pada database tidak valid.");
            return res.redirect("/document_names");
        }

        req.flash("error", "Gagal menambahkan nama dokumen.");
        return res.redirect("/document_names");

    } finally {
        if (client) client.release();
    }
});






<% if (message) { %>
    <div class="alert alert-success alert-dismissible fade show">
        <%= message %>

        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    </div>
<% } %>

<% if (errorMessage) { %>
    <div class="alert alert-danger alert-dismissible fade show">
        <%= errorMessage %>

        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    </div>
<% } %>
