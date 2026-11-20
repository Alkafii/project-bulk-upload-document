import { randomUUID } from "node:crypto";




const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function unlinkWithRetry(filePath, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await fs.promises.unlink(filePath);
      return;
    } catch (err) {
      if (err.code === "ENOENT") return;

      if (attempt === attempts) throw err;

      await sleep(200 * attempt);
    }
  }
}

async function removeDirectoryWithRetry(folderPath) {
  await fs.promises.rm(folderPath, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200
  });
}

function resolveSafePath(basePath, ...segments) {
  const resolvedBase = path.resolve(basePath);
  const resolvedTarget = path.resolve(resolvedBase, ...segments);
  const relativePath = path.relative(resolvedBase, resolvedTarget);

  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("INVALID_PATH");
  }

  return 
router.get("/delete_file", checkAuth, async (req, res) => {
  const { id, fileName } = req.query;

  let client;
  let transactionStarted = false;
  let committed = false;

  let sourcePath = null;
  let quarantinePath = null;
  let movedToQuarantine = false;

  try {
    // 1. Validasi request
    if (!id || typeof id !== "string" ||
        !fileName || typeof fileName !== "string") {
      return res.status(400).send("ID dan nama file wajib diisi.");
    }

    if (
      fileName !== path.basename(fileName) ||
      fileName.includes("/") ||
      fileName.includes("\\") ||
      fileName.startsWith(".")
    ) {
      return res.status(400).send("Nama file tidak valid.");
    }

    // 2. Mulai transaksi database
    client = await db.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    // 3. Lock record agar tidak diproses bersamaan
    const result = await client.query(
      `SELECT folder_name, uploaded_files
       FROM upload_document
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    const { folder_name, uploaded_files } = result.rows[0];

    // 4. Validasi folder
    if (
      !folder_name ||
      folder_name !== path.basename(folder_name) ||
      folder_name.includes("/") ||
      folder_name.includes("\\")
    ) {
      throw new Error("INVALID_FOLDER");
    }

    // 5. Validasi daftar dokumen
    let uploadedDocuments = [];

    try {
      uploadedDocuments = typeof uploaded_files === "string"
        ? JSON.parse(uploaded_files)
        : uploaded_files || [];
    } catch {
      throw new Error("INVALID_DOCUMENT_DATA");
    }

    if (!Array.isArray(uploadedDocuments)) {
      throw new Error("INVALID_DOCUMENT_DATA");
    }

    if (!uploadedDocuments.includes(fileName)) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).send("Dokumen tidak ditemukan.");
    }

    // 6. Tentukan lokasi file yang aman
    const baseFolder = path.resolve(
      process.cwd(),
      "data",
      "uploaded_file"
    );

    const folderPath = resolveSafePath(baseFolder, folder_name);
    sourcePath = resolveSafePath(folderPath, fileName);

    // 7. Pindahkan file ke quarantine
    quarantinePath = path.join(
      folderPath,
      `.deleting-${randomUUID()}`
    );

    try {
      await fs.promises.rename(sourcePath, quarantinePath);
      movedToQuarantine = true;
    } catch (err) {
      // Jika file sudah tidak ada secara fisik,
      // tetap bersihkan referensinya dari database.
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    // 8. Update database
    const updatedDocuments = uploadedDocuments.filter(
      file => file !== fileName
    );

    await client.query(
      `UPDATE upload_document
       SET uploaded_files = $1,
           updated_at = $2
       WHERE id = $3`,
      [
        JSON.stringify(updatedDocuments),
        new Date().toLocaleString("sv-SE"),
        id
      ]
    );

    // 9. Commit database
    await client.query("COMMIT");
    committed = true;
    transactionStarted = false;

    // 10. Hapus file quarantine
    if (movedToQuarantine) {
      try {
        await unlinkWithRetry(quarantinePath);
      } catch (cleanupError) {
        // Database sudah berhasil diperbarui.
        // Jangan mengembalikan error seolah transaksi gagal.
        console.error(
          "File quarantine belum berhasil dibersihkan:",
          quarantinePath,
          cleanupError
        );
      }
    }

    req.flash("success", "Dokumen berhasil dihapus!");
    return res.redirect(`/update_data?id=${encodeURIComponent(id)}`);

  } catch (err) {
    console.error("Error DELETE FILE:", err);

    // 11. Rollback jika transaksi belum commit
    if (client && transactionStarted && !committed) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback gagal:", rollbackError);
      }

      transactionStarted = false;
    }

    // 12. Kembalikan file jika transaksi gagal
    if (movedToQuarantine && !committed) {
      try {
        await fs.promises.rename(quarantinePath, sourcePath);
      } catch (restoreError) {
        console.error(
          "PERHATIAN: Gagal mengembalikan file:",
          restoreError
        );
      }
    }

    if (err.message === "INVALID_PATH") {
      return res.status(403).send("Akses file ditolak.");
    }

    if (err.message === "INVALID_FOLDER") {
      return res.status(400).send("Nama folder tidak valid.");
    }

    if (err.message === "INVALID_DOCUMENT_DATA") {
      return res.status(500).send("Data dokumen di database tidak valid.");
    }

    return res.status(500).send(
      "Gagal menghapus dokumen. Silakan periksa log server."
    );

  } finally {
    if (client) client.release();
  }
});




router.get("/delete", checkAuth, async (req, res) => {
  const { id } = req.query;

  let client;
  let transactionStarted = false;
  let committed = false;

  let originalFolder = null;
  let quarantineFolder = null;
  let movedToQuarantine = false;

  try {
    // 1. Validasi ID
    if (!id || typeof id !== "string") {
      return res.status(400).send("ID data tidak valid.");
    }

    // 2. Mulai transaksi
    client = await db.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    // 3. Lock record
    const result = await client.query(
      `SELECT folder_name
       FROM upload_document
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).send(
        "Data integrasi tidak ditemukan."
      );
    }

    const folderName = result.rows[0].folder_name;

    // 4. Validasi dan tentukan folder
    if (folderName) {
      if (
        folderName !== path.basename(folderName) ||
        folderName.includes("/") ||
        folderName.includes("\\")
      ) {
        throw new Error("INVALID_FOLDER");
      }

      const baseFolder = path.resolve(
        process.cwd(),
        "data",
        "uploaded_file"
      );

      originalFolder = resolveSafePath(
        baseFolder,
        folderName
      );

      quarantineFolder = path.join(
        baseFolder,
        `.deleting-${randomUUID()}`
      );

      // 5. Pindahkan folder ke quarantine
      try {
        await fs.promises.rename(
          originalFolder,
          quarantineFolder
        );

        movedToQuarantine = true;

      } catch (err) {
        // Folder sudah tidak ada secara fisik:
        // tetap lanjutkan penghapusan record database.
        if (err.code !== "ENOENT") {
          throw err;
        }
      }
    }

    // 6. Hapus record database
    await client.query(
      "DELETE FROM upload_document WHERE id = $1",
      [id]
    );

    // 7. Commit
    await client.query("COMMIT");
    committed = true;
    transactionStarted = false;

    // 8. Hapus seluruh folder quarantine
    if (movedToQuarantine) {
      try {
        await removeDirectoryWithRetry(quarantineFolder);
      } catch (cleanupError) {
        console.error(
          "Folder quarantine belum berhasil dibersihkan:",
          quarantineFolder,
          cleanupError
        );
      }
    }

    req.flash("success", "Mitra berhasil dihapus!");

    return res.redirect("/");

  } catch (err) {
    console.error("Error DELETE INTEGRATION:", err);

    // 9. Rollback transaksi
    if (client && transactionStarted && !committed) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback gagal:", rollbackError);
      }

      transactionStarted = false;
    }

    // 10. Kembalikan folder jika transaksi gagal
    if (movedToQuarantine && !committed) {
      try {
        await fs.promises.rename(
          quarantineFolder,
          originalFolder
        );
      } catch (restoreError) {
        console.error(
          "PERHATIAN: Gagal mengembalikan folder:",
          restoreError
        );
      }
    }

    if (err.message === "INVALID_PATH") {
      return res.status(403).send("Akses folder ditolak.");
    }

    if (err.message === "INVALID_FOLDER") {
      return res.status(400).send("Nama folder tidak valid.");
    }

    return res.status(500).send(
      "Gagal menghapus data integrasi. Silakan periksa log server."
    );

  } finally {
    if (client) client.release();
  }
});














