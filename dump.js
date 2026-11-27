<div class="d-flex justify-content-between align-items-center mt-3 flex-wrap">
    <h3 class="text-primary font-weight-bold mb-0">
        Detail Integration Documents
    </h3>

    <div class="d-flex align-items-center mt-2 mt-md-0">
        <% if (totalDocuments > 0) { %>
            <a
                href="/download_zip?id=<%= integration.id %>"
                class="btn btn-outline-primary mr-2"
            >
                <i class="fas fa-file-archive mr-1"></i>
                Download ZIP
            </a>
        <% } else { %>
            <button
                type="button"
                class="btn btn-outline-secondary mr-2"
                disabled
            >
                Download ZIP
            </button>
        <% } %>

        <a
            class="btn btn-primary"
            href="/update_data?id=<%= integration.id %>"
        >
            Edit
        </a>
    </div>
</div>








import { createReadStream } from "node:fs";
import archiver from "archiver";






router.get("/download_zip", checkAuth, async (req, res) => {
  let archive;

  try {
    const id = Number(req.query.id);

    // Validasi ID integrasi
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send("ID integrasi tidak valid.");
    }

    // Pastikan integrasi tersedia
    const integration = await getIntegration(id);

    if (!integration) {
      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    // Ambil SELURUH dokumen, tanpa pagination
    const result = await db.query(
      `SELECT
          d.id,
          d.original_filename,
          d.stored_filename,
          i.folder_name
       FROM uploaded_documents d
       INNER JOIN upload_document i
          ON i.id = d.upload_document_id
       WHERE d.upload_document_id = $1
       ORDER BY d.id ASC`,
      [id]
    );

    const documents = result.rows;

    if (documents.length === 0) {
      return res.status(404).send("Belum ada dokumen untuk diunduh.");
    }

    // Validasi folder penyimpanan
    const folderPath = path.resolve(
      STORAGE_ROOT,
      integration.folder_name
    );

    const relativeFolder = path.relative(
      STORAGE_ROOT,
      folderPath
    );

    if (
      !relativeFolder ||
      relativeFolder.startsWith("..") ||
      path.isAbsolute(relativeFolder)
    ) {
      return res.status(403).send("Akses folder ditolak.");
    }

    // Periksa seluruh file sebelum membuat ZIP
    const files = [];

    for (const doc of documents) {
      const storedFilename = doc.stored_filename;

      // Pastikan nama file tidak mengandung path
      if (
        !storedFilename ||
        path.basename(storedFilename) !== storedFilename
      ) {
        return res.status(403).send("Nama file tidak valid.");
      }

      const filePath = path.resolve(
        folderPath,
        storedFilename
      );

      const relativeFile = path.relative(
        folderPath,
        filePath
      );

      if (
        !relativeFile ||
        relativeFile.startsWith("..") ||
        path.isAbsolute(relativeFile)
      ) {
        return res.status(403).send("Akses file ditolak.");
      }

      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).send(
          `File tidak ditemukan: ${safeOriginalName(doc.original_filename)}`
        );
      }

      files.push({
        filePath,
        originalFilename: safeOriginalName(
          doc.original_filename
        )
      });
    }

    // Buat nama file ZIP yang aman
    const safePartnerName = text(integration.name, 100)
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    const safeApiName = text(integration.api_name, 100)
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    const zipFilename =
      `${safePartnerName}_${safeApiName}_Documents.zip`;

    // Hindari nama dokumen yang sama di dalam ZIP
    const usedNames = new Set();

    function getUniqueFilename(filename) {
      const extension = path.extname(filename);
      const basename = path.basename(filename, extension);

      let uniqueName = filename;
      let counter = 2;

      while (usedNames.has(uniqueName.toLowerCase())) {
        uniqueName = `${basename} (${counter})${extension}`;
        counter++;
      }

      usedNames.add(uniqueName.toLowerCase());

      return uniqueName;
    }

    // Siapkan response download
    res.setHeader(
      "Content-Type",
      "application/zip"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="documents.zip"; filename*=UTF-8''${encodeURIComponent(zipFilename)}`
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    // Buat archive ZIP
    archive = archiver("zip", {
      zlib: {
        level: 6
      }
    });

    archive.on("warning", (err) => {
      console.error("ZIP archive warning:", err);

      archive.abort();

      if (!res.headersSent) {
        res.status(500).send("Terjadi kesalahan saat membuat ZIP.");
      } else {
        res.destroy(err);
      }
    });

    archive.on("error", (err) => {
      console.error("ZIP archive error:", err);

      if (!res.headersSent) {
        res.status(500).send("Gagal membuat file ZIP.");
      } else {
        res.destroy(err);
      }
    });

    // Hubungkan archive ke response
    archive.pipe(res);

    // Masukkan seluruh dokumen ke ZIP
    for (const file of files) {
      const archiveFilename = getUniqueFilename(
        file.originalFilename
      );

      archive.file(file.filePath, {
        name: archiveFilename
      });
    }

    // Mulai proses pembuatan ZIP
    await archive.finalize();

  } catch (err) {
    console.error("GET /download_zip error:", err);

    if (archive) {
      archive.abort();
    }

    if (!res.headersSent) {
      return res.status(500).send(
        "Gagal mengunduh dokumen dalam format ZIP."
      );
    }

    res.destroy(err);
  }
});

