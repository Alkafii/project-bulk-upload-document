const data = new FormData(form);

data.delete('newDocuments');
data.delete('newDocumentNames');
data.delete('replacementDocumentIds');

// Menambahkan dokumen baru
for (const item of added) {
    data.append("newDocuments", item.file, item.file.name);
    data.append("newDocumentNames", item.name);
}

// Mengirim ID dokumen yang akan diganti
for (const fileInput of replacements) {
    data.append(
        "replacementDocumentIds",
        fileInput.dataset.id
    );
}





router.get("/update_data", checkAuth, async (req, res) => {
  try {
    const id = Number(req.query.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send("ID integrasi tidak valid.");
    }

    const integration = await getIntegration(id);

    if (!integration) {
      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    const result = await db.query(
      `SELECT
        id,
        document_name,
        original_filename,
        mime_type,
        file_size,
        created_at
       FROM uploaded_documents
       WHERE upload_document_id = $1
       ORDER BY id ASC`,
      [id]
    );

    const documents = result.rows;

    // Membuat HTML daftar dokumen
    let documentsHTML = "";

    if (documents.length === 0) {
      documentsHTML = `
        <p class="text-muted text-center py-4">
          There are no documents yet.
        </p>
      `;
    } else {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];

        const fileSize = (
          Number(doc.file_size) / (1024 * 1024)
        ).toFixed(2);

        documentsHTML += `
          <div class="doc-row main-doc-item">

            <div class="d-flex align-items-start w-100">

              <div
                class="font-weight-bold text-muted mr-3"
                style="font-size: 16px; min-width: 25px;"
              >
                ${i + 1}.
              </div>

              <div class="flex-fill">

                <div class="d-flex align-items-start w-100 mb-1">

                  <div>
                    <div class="font-weight-bold" style="font-size: 16px;">
                      ${escapeHTML(doc.document_name)}
                    </div>

                    <div class="small text-muted mb-1">
                      ${escapeHTML(doc.original_filename)}
                      · ${fileSize} MB
                    </div>
                  </div>

                  <label
                    class="text-danger small mb-0 font-weight-bold d-flex align-items-center ml-auto pt-1"
                    style="cursor: pointer; user-select: none; flex-shrink: 0;"
                  >
                    <input
                      type="checkbox"
                      name="deleteDocumentIds"
                      value="${encodeURIComponent(doc.id)}"
                      class="delete-doc mr-1"
                      style="cursor: pointer;"
                    >
                    Delete
                  </label>

                </div>

                <a
                  class="small font-weight-bold d-block mb-3"
                  href="/view_file?documentId=${encodeURIComponent(doc.id)}"
                  target="_blank"
                >
                  View Document
                </a>

                <div class="w-100">

                  <label class="small font-weight-bold mb-2 text-dark">
                    Replace (optional)
                  </label>

                  <div class="custom-file w-100">
                    <input
                      type="file"
                      class="custom-file-input replacement-file"
                      id="replace_${doc.id}"
                      name="replacementFiles"
                      data-id="${doc.id}"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                    >

                    <label
                      class="custom-file-label small text-muted"
                      for="replace_${doc.id}"
                      style="border-color: #ced4da; background-color: #fff;"
                    >
                      Choose file or drag here...
                    </label>
                  </div>

                </div>

              </div>
            </div>
          </div>
        `;
      }
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

    return res.render("update_data.ejs", {
      integration,
      totalDocuments: documents.length,
      documentsHTML,
      alertHTML,
      maxMB: MAX_MB,
      maxFiles: MAX_FILES,
      maxTotalMB: MAX_TOTAL_MB
    });

  } catch (err) {
    console.error("GET /update_data error:", err);
    return res.status(500).send("Gagal membuka halaman edit.");
  }
});





<div class="card-header bg-white font-weight-bold pt-4 px-4 border-0 pb-0">
    Current Documents (<%= totalDocuments %>)
</div>






<div id="mainDocListContainer">
    <%- documentsHTML %>
</div>



const deleteIds = ensureArray(req.body.deleteDocumentIds)
  .map(Number);

const replacementIds = ensureArray(
  req.body.replacementDocumentIds
).map(Number);

const newNames = ensureArray(req.body.newDocumentNames)
  .map(name => text(name, 255));

// Validasi ID penghapusan
for (const docId of deleteIds) {
  if (!Number.isInteger(docId) || docId <= 0) {
    throw new Error("ID dokumen yang akan dihapus tidak valid.");
  }
}

// Validasi ID penggantian
for (const docId of replacementIds) {
  if (!Number.isInteger(docId) || docId <= 0) {
    throw new Error("ID dokumen pengganti tidak valid.");
  }
}

// Mencegah ID duplikat
if (new Set(deleteIds).size !== deleteIds.length) {
  throw new Error("Terdapat ID dokumen penghapusan yang duplikat.");
}

if (new Set(replacementIds).size !== replacementIds.length) {
  throw new Error("Terdapat ID dokumen pengganti yang duplikat.");
}

// Dokumen tidak boleh dihapus dan diganti sekaligus
for (const docId of replacementIds) {
  if (deleteIds.includes(docId)) {
    throw new Error(
      "Dokumen yang sama tidak bisa dihapus dan diganti sekaligus."
    );
  }
}

// Validasi jumlah file
if (replacementIds.length !== replacementFiles.length) {
  throw new Error(
    "Jumlah ID dokumen pengganti tidak sesuai dengan jumlah file."
  );
}

if (newNames.length !== newFiles.length) {
  throw new Error(
    "Jumlah nama dokumen baru tidak sesuai dengan jumlah file."
  );
}

// Validasi nama dokumen baru
for (const name of newNames) {
  if (!name) {
    throw new Error("Nama dokumen baru tidak boleh kosong.");
  }
}






<script src="/js/update_data.js"></script>


