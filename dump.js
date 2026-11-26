function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/[&<>"']/g, function (char) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[char];
  });
}





router.get("/read_data", checkAuth, async (req, res) => {
  try {
    const id = Number(req.query.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send("ID integrasi tidak valid.");
    }

    const integration = await getIntegration(id);

    if (!integration) {
      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    // Pagination
    const itemsPerPage = 10;
    let currentPage = Number(req.query.page);

    if (!Number.isInteger(currentPage) || currentPage < 1) {
      currentPage = 1;
    }

    // Mengambil total dokumen dan total ukuran seluruh dokumen
    const summaryResult = await db.query(
      `SELECT
        COUNT(*)::int AS total_documents,
        COALESCE(SUM(file_size), 0)::bigint AS total_file_size
       FROM uploaded_documents
       WHERE upload_document_id = $1`,
      [id]
    );

    const totalDocuments = Number(summaryResult.rows[0].total_documents);
    const totalSize = (
      Number(summaryResult.rows[0].total_file_size) /
      (1024 * 1024)
    ).toFixed(2);

    let totalPages = Math.ceil(totalDocuments / itemsPerPage);

    if (totalPages < 1) {
      totalPages = 1;
    }

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const offset = (currentPage - 1) * itemsPerPage;

    // Mengambil dokumen sesuai halaman
    const docs = await db.query(
      `SELECT
        id,
        document_name,
        original_filename,
        mime_type,
        file_size,
        created_at
       FROM uploaded_documents
       WHERE upload_document_id = $1
       ORDER BY id ASC
       LIMIT $2 OFFSET $3`,
      [id, itemsPerPage, offset]
    );

    // Membuat HTML daftar dokumen
    let documentsHTML = "";

    if (docs.rows.length === 0) {
      documentsHTML = `
        <div class="text-muted text-center py-4">
          Belum ada dokumen.
        </div>
      `;
    } else {
      for (let i = 0; i < docs.rows.length; i++) {
        const doc = docs.rows[i];

        const documentNumber = offset + i + 1;
        const fileSize = (
          Number(doc.file_size) /
          (1024 * 1024)
        ).toFixed(2);

        let rowClass = "";

        if (i !== docs.rows.length - 1) {
          rowClass = "border-bottom pb-3 mb-3";
        }

        documentsHTML += `
          <div class="main-doc-item d-flex flex-wrap justify-content-between align-items-start ${rowClass}">

            <div class="d-flex pr-3">
              <div
                class="font-weight-bold text-muted mr-3"
                style="min-width: 25px;"
              >
                ${documentNumber}.
              </div>

              <div>
                <div class="font-weight-bold">
                  ${escapeHTML(doc.document_name)}
                </div>

                <small class="text-muted">
                  ${escapeHTML(doc.original_filename)}
                  ·
                  ${fileSize} MB
                </small>
              </div>
            </div>

            <div class="pt-1">
              <a
                class="btn btn-sm btn-outline-primary"
                href="/view_file?documentId=${encodeURIComponent(doc.id)}"
              >
                View
              </a>
            </div>

          </div>
        `;
      }
    }

    // Membuat HTML pagination
    let paginationHTML = "";

    if (totalPages > 1) {
      paginationHTML += `
        <nav class="mt-4" aria-label="Document pagination">
          <ul class="pagination pagination-sm justify-content-center mb-0">
      `;

      // Previous
      let previousClass = "";

      if (currentPage === 1) {
        previousClass = "disabled";
      }

      paginationHTML += `
        <li class="page-item ${previousClass}">
          <a
            class="page-link"
            href="/read_data?id=${id}&page=${currentPage - 1}"
          >
            &laquo;
          </a>
        </li>
      `;

      // Nomor halaman
      for (let page = 1; page <= totalPages; page++) {
        let activeClass = "";

        if (page === currentPage) {
          activeClass = "active";
        }

        paginationHTML += `
          <li class="page-item ${activeClass}">
            <a
              class="page-link"
              href="/read_data?id=${id}&page=${page}"
            >
              ${page}
            </a>
          </li>
        `;
      }

      // Next
      let nextClass = "";

      if (currentPage === totalPages) {
        nextClass = "disabled";
      }

      paginationHTML += `
        <li class="page-item ${nextClass}">
          <a
            class="page-link"
            href="/read_data?id=${id}&page=${currentPage + 1}"
          >
            &raquo;
          </a>
        </li>
      `;

      paginationHTML += `
          </ul>
        </nav>
      `;
    }

    // Membuat HTML alert
    let alertHTML = "";

    const message = req.flash("success")[0] || "";
    const errorMessage = req.flash("error")[0] || "";

    if (message) {
      alertHTML += `
        <div class="alert alert-success">
          ${escapeHTML(message)}
        </div>
      `;
    }

    if (errorMessage) {
      alertHTML += `
        <div class="alert alert-danger">
          ${escapeHTML(errorMessage)}
        </div>
      `;
    }

    return res.render("read_data.ejs", {
      integration,
      totalDocuments,
      totalSize,
      documentsHTML,
      paginationHTML,
      alertHTML
    });

  } catch (err) {
    console.error("GET /read_data error:", err);
    return res.status(500).send("Gagal membaca data integrasi.");
  }
});








<%- alertHTML %>




<div class="font-weight-bold">
    <%= totalDocuments %> Documents
</div>






<div class="card border-0 shadow-sm">
    <div class="card-header bg-white font-weight-bold pt-4 px-4 border-0 pb-0">
        Uploaded Documents
    </div>

    <div class="card-body p-4 upload-card-body">

        <%- documentsHTML %>

        <%- paginationHTML %>

    </div>
</div>









