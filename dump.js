l
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Upload Dokumen</title>

  <!-- Bootstrap -->
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css"
  >

  <!-- CSS utama aplikasi -->
  <link rel="stylesheet" href="/style/style.css">

  <!-- CSS khusus halaman upload -->
  <style>
    .upload-page {
      min-height: 100vh;
    }

    .upload-container {
      max-width: 1050px;
    }

    .dropzone {
      border: 2px dashed #9bb8df;
      border-radius: 12px;
      background: #f7faff;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: background-color .2s ease, border-color .2s ease;
    }

    .dropzone:hover,
    .dropzone.drag {
      background: #eaf2ff;
      border-color: #2563eb;
    }

    .dropzone:focus {
      outline: 3px solid rgba(37, 99, 235, .2);
      outline-offset: 2px;
    }

    .file-row {
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      padding: 14px;
      margin-bottom: 10px;
      background: #fff;
    }

    .file-name {
      font-size: 13px;
      color: #64748b;
      word-break: break-word;
    }

    #fileCount {
      white-space: nowrap;
    }

    #submitBtn:disabled {
      cursor: not-allowed;
      opacity: .65;
    }

    @media (max-width: 768px) {
      .upload-page main {
        padding: 16px !important;
      }

      .upload-container {
        padding-left: 0;
        padding-right: 0;
      }
    }

    @media (max-width: 576px) {
      .upload-card-body {
        padding: 16px !important;
      }

      .dropzone {
        padding: 24px 14px;
      }

      .file-row {
        padding: 12px;
      }

      .file-row .d-flex {
        gap: 10px;
      }

      .file-row .remove-file {
        flex-shrink: 0;
      }

      .upload-actions {
        flex-wrap: wrap;
      }
    }
  </style>
</head>

<body class="bg-light">

  <div class="d-flex upload-page">

    <!-- Sidebar -->
    <%- include('./partials/sidebar.ejs') %>

    <!-- Main Content -->
    <main class="flex-fill p-4">
      <div class="container-fluid upload-container">

        <a href="/" class="font-weight-bold">‹ Back</a>

        <h3 class="text-primary font-weight-bold mt-3 mb-4">
          Upload Dokumen Integrasi
        </h3>

        <% if (typeof message !== "undefined" && message) { %>
          <div class="alert alert-success">
            <%= message %>
          </div>
        <% } %>

        <% if (typeof errorMessage !== "undefined" && errorMessage) { %>
          <div class="alert alert-danger">
            <%= errorMessage %>
          </div>
        <% } %>

        <!-- Upload Form -->
        <form
          id="uploadForm"
          action="/upload"
          method="POST"
          enctype="multipart/form-data"
          class="card shadow-sm border-0"
        >

          <div class="card-body p-4 upload-card-body">

            <!-- Partner Name -->
            <div class="form-group">
              <label for="institutionName">
                Partner Name <span class="text-danger">*</span>
              </label>

              <input
                type="text"
                class="form-control"
                id="institutionName"
                name="institutionName"
                maxlength="256"
                placeholder="ex: Pemda Kota Bandung"
                autocomplete="organization"
                required
              >
            </div>

            <!-- API Name -->
            <div class="form-group">
              <label for="integrationType">
                API Name <span class="text-danger">*</span>
              </label>

              <input
                type="text"
                class="form-control"
                id="integrationType"
                name="integrationType"
                maxlength="128"
                placeholder="ex: Virtual Account SNAP"
                required
              >
            </div>

            <hr>

            <!-- Documents Header -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="font-weight-bold mb-0">
                Documents List
              </h5>

              <span
                class="badge badge-primary"
                id="fileCount"
                aria-live="polite"
              >
                0 file
              </span>
            </div>

            <p class="text-muted small">
              Select or drag multiple files. Document names automatically
              match the filenames and can be edited before saving.
            </p>

            <!-- Dropzone -->
            <div
              class="dropzone"
              id="dropzone"
              role="button"
              tabindex="0"
              aria-label="Pilih atau jatuhkan dokumen di sini"
            >
              <div class="h4 mb-2">☁</div>

              <strong>Drag and drop files here</strong>

              <div class="text-muted small my-2">
                or click to select multiple files
              </div>

              <span class="btn btn-outline-primary btn-sm">
                Select Documents
              </span>

              <input
                type="file"
                id="fileInput"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                multiple
                hidden
              >
            </div>

            <!-- Upload Information -->
            <div class="small text-muted mt-2">
              Format: PDF, DOC, DOCX, XLS, XLSX.
              Max. <%= maxMB %> MB per file,
              <%= maxTotalMB %> MB total,
              <%= maxFiles %> file per proses.
            </div>

            <!-- Selected Files -->
            <div id="fileList" class="mt-4"></div>

            <!-- Buttons -->
            <div class="d-flex justify-content-end mt-4 upload-actions">
              <a href="/" class="btn btn-light mr-2">
                Batal
              </a>

              <button
                type="submit"
                class="btn btn-primary"
                id="submitBtn"
                disabled
              >
                Upload
              </button>
            </div>

          </div>
        </form>

      </div>
    </main>
  </div>

  <!-- JavaScript -->
  <script>
    (() => {
      "use strict";

      // ==========================================
      // ELEMENT REFERENCES
      // ==========================================

      const form = document.getElementById("uploadForm");
      const input = document.getElementById("fileInput");
      const drop = document.getElementById("dropzone");
      const list = document.getElementById("fileList");
      const count = document.getElementById("fileCount");
      const submit = document.getElementById("submitBtn");

      // ==========================================
      // UPLOAD CONFIGURATION FROM EJS
      // ==========================================

      const maxFile = <%= maxMB * 1024 * 1024 %>;
      const maxTotal = <%= maxTotalMB * 1024 * 1024 %>;
      const maxFiles = <%= maxFiles %>;

      const allowed = ["pdf", "doc", "docx", "xls", "xlsx"];

      let selected = [];
      let isUploading = false;

      // ==========================================
      // HELPER FUNCTIONS
      // ==========================================

      function formatSize(size) {
        if (size < 1024 * 1024) {
          return (size / 1024).toFixed(1) + " KB";
        }

        return (size / 1024 / 1024).toFixed(2) + " MB";
      }

      function defaultName(file) {
        return file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " ")
          .trim();
      }

      function getExtension(filename) {
        const parts = filename.split(".");

        if (parts.length < 2) {
          return "";
        }

        return parts.pop().toLowerCase();
      }

      function getTotalSize() {
        return selected.reduce(
          (total, item) => total + item.file.size,
          0
        );
      }

      function getFileKey(file) {
        return [
          file.name,
          file.size,
          file.lastModified
        ].join("|");
      }

      // ==========================================
      // FILE VALIDATION
      // ==========================================

      function validateFile(file) {
        const extension = getExtension(file.name);

        if (!allowed.includes(extension)) {
          return "Format tidak didukung: " + file.name;
        }

        if (file.size === 0) {
          return "File kosong tidak dapat diunggah: " + file.name;
        }

        if (file.size > maxFile) {
          return "File melebihi batas per file: " + file.name;
        }

        return "";
      }

      // ==========================================
      // RENDER FILE LIST
      // ==========================================

      function render() {
        list.innerHTML = "";

        selected.forEach((item, index) => {
          const row = document.createElement("div");

          row.className = "file-row";

          row.innerHTML = `
            <div class="d-flex align-items-start">

              <div class="flex-fill pr-3">

                <label class="font-weight-bold mb-1">
                  Nama dokumen
                </label>

                <input
                  type="text"
                  class="form-control form-control-sm doc-name"
                  maxlength="255"
                  placeholder="Masukkan nama dokumen"
                  required
                >

                <div class="file-name mt-2"></div>

              </div>

              <button
                type="button"
                class="btn btn-sm btn-outline-danger remove-file"
                aria-label="Hapus dokumen"
              >
                Hapus
              </button>

            </div>
          `;

          const nameInput = row.querySelector(".doc-name");
          const fileName = row.querySelector(".file-name");
          const removeButton = row.querySelector(".remove-file");

          nameInput.value = item.name;

          fileName.textContent =
            item.file.name + " · " + formatSize(item.file.size);

          nameInput.addEventListener("input", (event) => {
            item.name = event.target.value;
          });

          removeButton.addEventListener("click", () => {
            selected.splice(index, 1);
            render();
          });

          list.appendChild(row);
        });

        const total = getTotalSize();

        count.textContent =
          selected.length + " file · " + formatSize(total);

        submit.disabled =
          selected.length === 0 || isUploading;
      }

      // ==========================================
      // ADD FILES
      // ==========================================

      function addFiles(files) {
        if (isUploading) return;

        const incoming = Array.from(files || []);

        for (const file of incoming) {

          const error = validateFile(file);

          if (error) {
            alert(error);
            continue;
          }

          if (selected.length >= maxFiles) {
            alert("Maksimal " + maxFiles + " file dalam satu proses.");
            break;
          }

          const duplicate = selected.some(
            (item) => getFileKey(item.file) === getFileKey(file)
          );

          if (duplicate) {
            alert("File sudah ada dalam daftar: " + file.name);
            continue;
          }

          if (getTotalSize() + file.size > maxTotal) {
            alert(
              "Total ukuran file maksimal " +
              formatSize(maxTotal) +
              "."
            );

            break;
          }

          selected.push({
            file: file,
            name: defaultName(file)
          });
        }

        input.value = "";
        render();
      }

      // ==========================================
      // FILE INPUT EVENTS
      // ==========================================

      drop.addEventListener("click", () => {
        if (!isUploading) input.click();
      });

      drop.addEventListener("keydown", (event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          if (!isUploading) input.click();
        }
      });

      input.addEventListener("change", () => {
        addFiles(input.files);
      });

      // ==========================================
      // DRAG AND DROP EVENTS
      // ==========================================

      ["dragenter", "dragover"].forEach((eventName) => {
        drop.addEventListener(eventName, (event) => {
          event.preventDefault();
          event.stopPropagation();

          if (!isUploading) {
            drop.classList.add("drag");
          }
        });
      });

      ["dragleave", "drop"].forEach((eventName) => {
        drop.addEventListener(eventName, (event) => {
          event.preventDefault();
          event.stopPropagation();

          drop.classList.remove("drag");
        });
      });

      drop.addEventListener("drop", (event) => {
        if (isUploading) return;

        addFiles(event.dataTransfer.files);
      });

      // ==========================================
      // FORM SUBMISSION
      // ==========================================

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isUploading) return;

        // Validasi Partner Name dan API Name.
        const institutionName =
          form.elements.institutionName.value.trim();

        const integrationType =
          form.elements.integrationType.value.trim();

        if (!institutionName || !integrationType) {
          alert("Partner Name dan API Name wajib diisi.");
          return;
        }

        // Validasi jumlah file.
        if (selected.length === 0) {
          alert("Pilih minimal satu dokumen.");
          return;
        }

        if (selected.length > maxFiles) {
          alert("Jumlah file melebihi batas maksimal.");
          return;
        }

        // Validasi nama dokumen.
        const names = selected.map((item) => item.name.trim());

        if (names.some((name) => !name)) {
          alert("Nama dokumen tidak boleh kosong.");
          return;
        }

        if (names.some((name) => name.length > 255)) {
          alert("Nama dokumen maksimal 255 karakter.");
          return;
        }

        // Validasi nama dokumen duplikat.
        const normalizedNames = names.map((name) =>
          name.toLocaleLowerCase("id-ID")
        );

        if (
          new Set(normalizedNames).size !== normalizedNames.length
        ) {
          alert("Nama dokumen tidak boleh sama.");
          return;
        }

        // Validasi ulang file.
        for (const item of selected) {
          const error = validateFile(item.file);

          if (error) {
            alert(error);
            return;
          }
        }

        // Validasi total ukuran.
        const totalSize = getTotalSize();

        if (totalSize > maxTotal) {
          alert("Total ukuran file melebihi batas maksimal.");
          return;
        }

        // ========================================
        // PREPARE FORMDATA
        // ========================================

        const formData = new FormData(form);

        formData.delete("documents");
        formData.delete("documentNames");

        selected.forEach((item) => {
          formData.append(
            "documents",
            item.file,
            item.file.name
          );

          formData.append(
            "documentNames",
            item.name.trim()
          );
        });

        // ========================================
        // SEND TO BACKEND
        // ========================================

        isUploading = true;

        submit.disabled = true;
        submit.textContent = "Mengunggah...";

        try {
          const response = await fetch(form.action, {
            method: "POST",
            body: formData,
            redirect: "follow"
          });

          if (response.redirected) {
            window.location.assign(response.url);
            return;
          }

          if (!response.ok) {
            throw new Error(
              "Upload gagal. HTTP " + response.status
            );
          }

          throw new Error(
            "Server tidak memberikan respons redirect yang diharapkan."
          );

        } catch (error) {
          console.error("Upload error:", error);

          alert(
            error.message ||
            "Terjadi kesalahan saat mengunggah dokumen."
          );

          isUploading = false;
          submit.textContent = "Upload";

          render();
        }
      });

      // ==========================================
      // INITIAL PAGE STATE
      // ==========================================

      render();

    })();
  </script>

</body>
</html>
