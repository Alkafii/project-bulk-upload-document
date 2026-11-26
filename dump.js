
router.get("/", checkAuth, async (req, res) => {
  try {
    const queryText = `
      SELECT
        i.*,
        COUNT(d.id)::int AS uploaded_count,
        COALESCE(SUM(d.file_size), 0)::bigint AS total_file_size
      FROM upload_document i
      LEFT JOIN uploaded_documents d
        ON d.upload_document_id = i.id
      GROUP BY i.id
      ORDER BY i.id DESC
    `;

    const result = await db.query(queryText);
    const integrations = result.rows;

    // Helper untuk mengamankan teks HTML
    function escapeHTML(value) {
      return String(value ?? "").replace(/[&<>"']/g, function (char) {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };

        return entities[char];
      });
    }

    // Menyiapkan HTML tabel
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

        // Format ukuran dokumen
        const sizeMB = (
          Number(item.total_file_size || 0) / (1024 * 1024)
        ).toFixed(2);

        // Format tanggal pembuatan
        let createdAt = "-";

        if (item.created_at) {
          createdAt = new Date(item.created_at).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
          });
        }

        // Format tanggal pembaruan
        let updatedAt = "-";

        if (item.updated_at) {
          updatedAt = new Date(item.updated_at).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
          });
        }

        // Membuat baris tabel
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
      errorMessage: req.flash("error")[0] || "",
    });

  } catch (err) {
    console.error("GET / error:", err);
    return res.status(500).send("Gagal mengambil data integrasi.");
  }
});
