
router.get("/", checkAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                i.*,
                COUNT(d.id)::int AS uploaded_count,
                COALESCE(SUM(d.file_size), 0)::bigint AS total_file_size
            FROM upload_document i
            LEFT JOIN uploaded_documents d
                ON d.upload_document_id = i.id
            GROUP BY i.id
            ORDER BY i.id DESC
        `);

        const integrations = result.rows;

        let tableRows = "";

        if (integrations.length === 0) {
            tableRows = `
                <tr>
                    <td colspan="8" class="p-0 bg-white">
                        <div class="row no-gutters p-4 text-center bg-white text-muted justify-content-center">
                            No integration data available.
                        </div>
                    </td>
                </tr>
            `;
        } else {
            for (let i = 0; i < integrations.length; i++) {
                const item = integrations[i];

                const sizeMB = (
                    Number(item.total_file_size || 0) /
                    (1024 * 1024)
                ).toFixed(2);

                let createdAt = "-";

                if (item.created_at) {
                    createdAt = new Date(item.created_at).toLocaleString(
                        "id-ID",
                        {
                            timeZone: "Asia/Jakarta"
                        }
                    );
                }

                let updatedAt = "-";

                if (item.updated_at) {
                    updatedAt = new Date(item.updated_at).toLocaleString(
                        "id-ID",
                        {
                            timeZone: "Asia/Jakarta"
                        }
                    );
                }

                tableRows += `
                    <tr class="align-middle">
                        <td class="pl-4 align-middle" style="width: 90px;">
                            <div class="d-flex align-items-center justify-content-start">
                                <div style="width: 32px;" class="text-left d-flex align-items-center">
                                    <input
                                        class="form-check-input check"
                                        type="checkbox"
                                        id="check_${item.id}"
                                        value="${item.id}"
                                        data-name="${escapeHTML(item.name)}"
                                        style="position: static; margin: 0; flex-shrink: 0;"
                                    >
                                </div>

                                <span class="font-weight-bold text-muted pl-1">
                                    ${i + 1}
                                </span>
                            </div>
                        </td>

                        <td class="font-weight-bold">
                            ${escapeHTML(item.name)}
                        </td>

                        <td>
                            ${escapeHTML(item.api_name)} ${escapeHTML(item.va_type || "")}
                        </td>

                        <td>${escapeHTML(createdAt)}</td>
                        <td>${escapeHTML(updatedAt)}</td>

                        <td class="text-center">
                            <span class="badge badge-primary px-2 py-1">
                                ${Number(item.uploaded_count || 0)}
                            </span>
                        </td>

                        <td class="text-center">
                            ${sizeMB} MB
                        </td>

                        <td class="text-nowrap text-center pr-4">
                            <a
                                href="/read_data?id=${encodeURIComponent(item.id)}"
                                class="btn btn-sm btn-outline-primary mr-1"
                            >
                                View
                            </a>
                        </td>
                    </tr>
                `;
            }
        }

        return res.render("index.ejs", {
            tableRows: tableRows,
            message: req.flash("success")[0] || "",
            errorMessage: req.flash("error")[0] || ""
        });

    } catch (err) {
        console.error("GET / error:", err);

        return res.status(500).send(
            "Gagal mengambil data integrasi."
        );
    }
});








router.post(
    "/upload",
    checkAuth,
    upload.array("documents", MAX_FILES),
    async (req, res) => {
        const folderName = `integration-${randomUUID()}`;
        const folderPath = path.join(STORAGE_ROOT, folderName);

        let client;
        let folderCreated = false;
        let transactionStarted = false;

        try {
            // 1. Ambil dan validasi file
            const files = req.files || [];

            validateUploadBatch(files);

            const institution = text(req.body.institutionName, 256);
            const apiName = text(req.body.integrationType, 128);

            const documentNames = ensureArray(
                req.body.documentNames
            ).map(name => text(name, 255));

            if (!institution || !apiName) {
                throw new Error(
                    "Nama mitra (Partner Name) dan API Name wajib diisi."
                );
            }

            if (files.length === 0) {
                throw new Error(
                    "Silakan pilih minimal 1 dokumen untuk diunggah."
                );
            }

            if (documentNames.length !== files.length) {
                throw new Error(
                    "Jumlah nama dokumen tidak sesuai dengan berkas yang dipilih."
                );
            }

            // 2. Validasi nama dokumen
            const lowerCaseNames = [];

            for (const docName of documentNames) {
                if (!docName) {
                    throw new Error(
                        "Nama dokumen tidak boleh kosong."
                    );
                }

                lowerCaseNames.push(docName.toLowerCase());
            }

            if (
                new Set(lowerCaseNames).size !==
                lowerCaseNames.length
            ) {
                throw new Error(
                    "Nama dokumen di dalam daftar tidak boleh ada yang sama."
                );
            }

            // 3. Buat folder penyimpanan
            await fs.mkdir(folderPath, {
                recursive: true
            });

            folderCreated = true;

            // 4. Mulai transaksi database
            client = await db.connect();

            await client.query("BEGIN");
            transactionStarted = true;

            // 5. Simpan data integrasi
            const integrationResult = await client.query(
                `INSERT INTO upload_document
                    (name, api_name, folder_name, created_at, updated_at)
                 VALUES
                    ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id`,
                [institution, apiName, folderName]
            );

            const integrationId = integrationResult.rows[0].id;

            // 6. Simpan seluruh dokumen
            for (let i = 0; i < files.length; i++) {
                const metadata = await writeUploadedFile(
                    files[i],
                    folderPath
                );

                await insertDocument(
                    client,
                    integrationId,
                    metadata,
                    documentNames[i]
                );
            }

            // 7. Commit transaksi
            await client.query("COMMIT");
            transactionStarted = false;

            // 8. Siapkan notifikasi sukses
            const successMessage =
                `Data integrasi berhasil ditambahkan. ${files.length} dokumen berhasil diunggah.`;

            req.flash("success", successMessage);

            // 9. Simpan session sebelum redirect
            if (
                req.get("X-Requested-With") === "XMLHttpRequest"
            ) {
                return req.session.save(function (err) {
                    if (err) {
                        console.error(
                            "Gagal menyimpan session:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Data berhasil disimpan, tetapi notifikasi gagal disimpan."
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        redirectUrl: "/"
                    });
                });
            }

            // Untuk request form biasa
            return res.redirect("/");

        } catch (err) {
            console.error("POST /upload error:", err);

            // 10. Rollback jika transaksi belum berhasil commit
            if (client && transactionStarted) {
                await client.query("ROLLBACK").catch(rollbackError => {
                    console.error(
                        "Gagal melakukan rollback:",
                        rollbackError
                    );
                });

                transactionStarted = false;
            }

            // 11. Bersihkan folder jika proses upload gagal
            if (folderCreated) {
                await fs.rm(folderPath, {
                    recursive: true,
                    force: true
                }).catch(cleanupError => {
                    console.error(
                        "Gagal membersihkan folder upload:",
                        cleanupError
                    );
                });
            }

            const errorMessage =
                err.message || "Gagal menyimpan dokumen.";

            if (
                req.get("X-Requested-With") === "XMLHttpRequest"
            ) {
                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }

            return flashError(
                req,
                res,
                errorMessage,
                "/upload"
            );

        } finally {
            if (client) {
                client.release();
            }
        }
    }
);
