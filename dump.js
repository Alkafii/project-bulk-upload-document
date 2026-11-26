
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

    const integrations = result.rows.map((item) => {
      const totalSize = Number(item.total_file_size || 0);

      return {
        ...item,

        // Format jumlah dokumen
        uploaded_count: Number(item.uploaded_count || 0),

        // Format ukuran seluruh dokumen
        formatted_total_size:
          (totalSize / (1024 * 1024)).toFixed(2) + " MB",

        // Format tanggal pembuatan
        formatted_created_at: item.created_at
          ? new Date(item.created_at).toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
            })
          : "-",

        // Format tanggal pembaruan
        formatted_updated_at: item.updated_at
          ? new Date(item.updated_at).toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
            })
          : "-",
      };
    });

    return res.render("index.ejs", {
      integrations,
      message: req.flash("success")[0] || "",
      errorMessage: req.flash("error")[0] || "",
    });

  } catch (err) {
    console.error("GET / error:", err);

    return res.status(500).send("Gagal mengambil data integrasi.");
  }
});




<tbody>
    <% if (!integrations || integrations.length === 0) { %>
        <tr>
            <td colspan="8" class="p-0 bg-white">
                <div class="row no-gutters p-4 text-center bg-white text-muted justify-content-center">
                    No integration data available.
                </div>
            </td>
        </tr>
    <% } else { %>

        <% integrations.forEach((item, i) => { %>
            <tr class="align-middle">
                <td class="pl-4 align-middle" style="width: 90px;">
                    <div class="d-flex align-items-center justify-content-start">
                        <div style="width: 32px;" class="text-left d-flex align-items-center">
                            <input
                                class="form-check-input check"
                                type="checkbox"
                                id="check_<%= item.id %>"
                                value="<%= item.id %>"
                                data-name="<%= item.name %>"
                                style="position: static; margin: 0; flex-shrink: 0;"
                            >
                        </div>

                        <span class="font-weight-bold text-muted pl-1 align-self-center">
                            <%= i + 1 %>
                        </span>
                    </div>
                </td>

                <td class="font-weight-bold">
                    <%= item.name %>
                </td>

                <td>
                    <%= item.api_name %> <%= item.va_type || '' %>
                </td>

                <td>
                    <%= item.formatted_created_at %>
                </td>

                <td>
                    <%= item.formatted_updated_at %>
                </td>

                <td class="text-center">
                    <span class="badge badge-primary px-2 py-1">
                        <%= item.uploaded_count %>
                    </span>
                </td>

                <td class="text-center">
                    <%= item.formatted_total_size %>
                </td>

                <td class="text-nowrap text-center pr-4">
                    <a
                        href="/read_data?id=<%= item.id %>"
                        class="btn btn-sm btn-outline-primary mr-1"
                    >
                        View
                    </a>
                </td>
            </tr>
        <% }) %>

    <% } %>
</tbody>



