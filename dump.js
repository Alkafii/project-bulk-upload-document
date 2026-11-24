
<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <title>Upload Dokumen</title>

    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css"
    />

    <!-- CSS utama aplikasi -->
    <link rel="stylesheet" href="/style/style.css" />

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
        transition:
          background-color 0.2s ease,
          border-color 0.2s ease;
      }

      .dropzone:hover,
      .dropzone.drag {
        background: #eaf2ff;
        border-color: #2563eb;
      }

      .dropzone:focus {
        outline: 3px solid rgba(37, 99, 235, 0.2);
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

      .file-row .doc-name {
        width: 100%;
      }

      #fileCount {
        white-space: nowrap;
      }

      #submitBtn:disabled {
        cursor: not-allowed;
        opacity: 0.65;
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

        .upload-actions .btn {
          flex: 1;
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

          <a href="/" class="font-weight-bold">
            ‹ Back
          </a>

          <h3 class="text-primary font-weight-bold mt-3 mb-4">
            Upload Dokumen Integrasi
          </h3>

          <!-- Success Message -->
          <% if (typeof message !== "undefined" && message) { %>
            <div class="alert alert-success">
              <%= message %>
            </div>
          <% } %>

          <!-- Error Message -->
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
                  Partner Name
                  <span class="text-danger">*</span>
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
                />
              </div>

              <!-- API Name -->
              <div class="form-group">
                <label for="integrationType">
                  API Name
                  <span class="text-danger">*</span>
                </label>

                <input
                  type="text"
                  class="form-control"
                  id="integrationType"
                  name="integrationType"
                  maxlength="128"
                  placeholder="ex: Virtual Account SNAP"
                  required
                />
              </div>

              <hr />

              <!-- Document Header -->
              <div
                class="d-flex justify-content-between align-items-center mb-2"
              >
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
                <div class="h4 mb-2">
                  ☁
                </div>

                <strong>
                  Drag and drop files here
                </strong>

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
                />
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

              <!-- Action Buttons -->
              <div
                class="d-flex justify-content-end mt-4 upload-actions"
              >
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

    <!-- Upload JavaScript -->
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
        // UPLOAD CONFIGURATION
        // ==========================================

        const maxFile = <%= maxMB * 1024 * 1024 %>;
        const maxTotal = <%= maxTotalMB * 1024 * 1024 %>;
        const maxFiles = <%= maxFiles %>;

        const allowed = [
          "pdf",
          "doc",
          "docx",
          "xls",
          "xlsx"
        ];

        // Menyimpan file yang dipilih sebelum dikirim ke server.
        let selected = [];

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
            return (
              "Format tidak didukung: " +
              file.name
            );
          }

          if (file.size === 0) {
            return (
              "File kosong tidak dapat diunggah: " +
              file.name
            );
          }

          if (file.size > maxFile) {
            return (
              "File melebihi batas per file: " +
              file.name
            );
          }

          return "";
        }

        // ==========================================
        // RENDER SELECTED FILES
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
                  />

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

            // Isi nama dokumen.
            nameInput.value = item.name;

            // Tampilkan informasi file.
            fileName.textContent =
              item.file.name +
              " · " +
              formatSize(item.file.size);

            // Update nama dokumen.
            nameInput.addEventListener("input", (event) => {
              item.name = event.target.value;
            });

            // Hapus file dari daftar.
            removeButton.addEventListener("click", () => {
              selected.splice(index, 1);
              render();
            });

            list.appendChild(row);
          });

          // Update jumlah dan ukuran file.
          const total = getTotalSize();

          count.textContent =
            selected.length +
            " file · " +
            formatSize(total);

          // Tombol upload hanya aktif jika ada file.
          submit.disabled = selected.length === 0;
        }

        // ==========================================
        // ADD FILES
        // ==========================================

        function addFiles(files) {
          const incoming = Array.from(files || []);

          for (const file of incoming) {

            // Validasi format dan ukuran file.
            const error = validateFile(file);

            if (error) {
              alert(error);
              continue;
            }

            // Validasi jumlah file.
            if (selected.length >= maxFiles) {
              alert(
                "Maksimal " +
                maxFiles +
                " file dalam satu proses."
              );

              break;
            }

            // Mencegah file yang sama ditambahkan dua kali.
            const duplicate = selected.some(
              (item) => getFileKey(item.file) === getFileKey(file)
            );

            if (duplicate) {
              alert(
                "File sudah ada dalam daftar: " +
                file.name
              );

              continue;
            }

            // Validasi total ukuran file.
            if (getTotalSize() + file.size > maxTotal) {
              alert(
                "Total ukuran file maksimal " +
                formatSize(maxTotal) +
                "."
              );

              break;
            }

            // Masukkan file ke daftar sementara.
            selected.push({
              file: file,
              name: defaultName(file)
            });
          }

          // Reset input agar file yang sama bisa dipilih kembali
          // setelah sebelumnya dihapus dari daftar.
          input.value = "";

          render();
        }

        // ==========================================
        // FILE INPUT EVENTS
        // ==========================================

        drop.addEventListener("click", () => {
          input.click();
        });

        drop.addEventListener("keydown", (event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            input.click();
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

            drop.classList.add("drag");
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
          addFiles(event.dataTransfer.files);
        });

        // ==========================================
        // FORM SUBMISSION
        // ==========================================

        form.addEventListener("submit", async (event) => {
          event.preventDefault();

          // Mencegah pengiriman berulang.
          if (submit.disabled) {
            return;
          }

          // Validasi data partner.
          const institutionName =
            form.elements.institutionName.value.trim();

          const integrationType =
            form.elements.integrationType.value.trim();

          if (!institutionName || !integrationType) {
            alert(
              "Partner Name dan API Name wajib diisi."
            );

            return;
          }

          // Validasi jumlah file.
          if (selected.length === 0) {
            alert("Pilih minimal satu dokumen.");
            return;
          }

          if (selected.length > maxFiles) {
            alert(
              "Maksimal " +
              maxFiles +
              " file dalam satu proses."
            );

            return;
          }

          // Validasi nama dokumen.
          const names = selected.map((item) =>
            item.name.trim()
          );

          if (names.some((name) => !name)) {
            alert("Nama dokumen tidak boleh kosong.");
            return;
          }

          // Validasi panjang nama dokumen.
          if (names.some((name) => name.length > 255)) {
            alert(
              "Nama dokumen maksimal 255 karakter."
            );

            return;
          }

          // Validasi nama dokumen duplikat.
          const normalizedNames = names.map((name) =>
            name.toLocaleLowerCase("id-ID")
          );

          if (
            new Set(normalizedNames).size !==
            normalizedNames.length
          ) {
            alert(
              "Nama dokumen tidak boleh sama. Silakan periksa kembali."
            );

            return;
          }

          // Validasi total ukuran file.
          const totalSize = getTotalSize();

          if (totalSize > maxTotal) {
            alert(
              "Total ukuran file melebihi batas maksimal " +
              formatSize(maxTotal) +
              "."
            );

            return;
          }

          // Validasi ulang setiap file.
          for (const item of selected) {
            const error = validateFile(item.file);

            if (error) {
              alert(error);
              return;
            }
          }

          // ========================================
          // PREPARE FORMDATA
          // ========================================

          const formData = new FormData(form);

          // Pastikan tidak ada field file lama.
          formData.delete("documents");
          formData.delete("documentNames");

          // Masukkan seluruh file dan nama dokumennya
          // dengan urutan yang sama.
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

          submit.disabled = true;
          submit.textContent = "Mengunggah...";

          try {
            const response = await fetch(form.action, {
              method: "POST",
              body: formData,
              redirect: "follow"
            });

            // Express biasanya mengembalikan redirect
            // setelah proses upload berhasil atau gagal.
            if (response.redirected) {
              window.location.href = response.url;
              return;
            }

            if (!response.ok) {
              throw new Error(
                "Upload gagal. HTTP " + response.status
              );
            }

            // Jika server tidak melakukan redirect.
            throw new Error(
              "Server tidak memberikan respons redirect yang diharapkan."
            );

          } catch (error) {
            console.error("Upload error:", error);

            alert(
              error.message ||
              "Terjadi kesalahan saat mengunggah dokumen."
            );

            submit.disabled = selected.length === 0;
            submit.textContent = "Upload";
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

