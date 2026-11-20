router.get("/delete", checkAuth, async (req, res) => {
  try{
    const id = req.query.id;

    if (typeof id === "undefined" || id === "") {
      return res.status(400).send("ID data tidak valid.");
    }

    const dataDb = (await db.query("SELECT folder_name FROM upload_document WHERE id = $1", [id])).rows;

    if(dataDb.length === 0) {
      return res.status(404).json({ message: 'Data integrasi tidak ditemukan!' });
    }

    const folderName = dataDb[0].folder_name;

    if (!folderName) {
      console.error('Folder penyimpanan tidak ditemukan:', { folderName });
      return res.status(400).json({ message: 'folderName wajib dikirim!' });

    } else {
      if (path.basename(folderName) !== folderName) {
        return res.status(400).send("Nama folder atau file tidak valid.");
      }
      
      const baseFolder = path.resolve(process.cwd(), "data", "uploaded_file");
      const folderPath = path.resolve(baseFolder, folderName);
      const relativeFolder = path.relative(baseFolder, folderPath);

      if (
        !relativeFolder || relativeFolder.startsWith("..") || path.isAbsolute(relativeFolder)
      ) {
        return res.status(403).send("Akses file ditolak.");
      }

      await fs.promises.rm(folderPath, { recursive: true, force: true });

      await db.query("DELETE FROM upload_document WHERE id = $1", [id]);

      req.flash("success", "Mitra berhasil dihapus!");
      return res.redirect("/");
    }
  } catch(err) {
    console.error("Error pada route /delete:", err);
    res.status(500).send("Terjadi kesalahan sistem pada route /delete.");
  }
});


router.get("/delete_file", checkAuth, async (req, res) => {
  try {
    const id = req.query.id;
    const fileName = req.query.fileName;

    if (!id || !fileName) {
      return res.status(400).send("ID dan nama file wajib diisi.");
    }

    const dataDb = (await db.query("SELECT folder_name, uploaded_files FROM upload_document WHERE id = $1", [id])).rows;

    if (dataDb.length === 0) {
      return res.status(404).send("Data integrasi tidak ditemukan.");
    }

    const folderName = dataDb[0].folder_name;
    const date = new Date().toLocaleString("sv-SE");

    if (!folderName) {
      return res.status(400).send("Folder penyimpanan tidak ditemukan.");
    }

    const targetData = dataDb[0].uploaded_files;

    const arrayFile =
      typeof targetData === "string" ? JSON.parse(targetData) : targetData || [];

    if (!arrayFile.includes(fileName)) {
      return res.status(404).send("Dokumen tidak ditemukan.");
    }

    if (path.basename(folderName) !== folderName || path.basename(fileName) !== fileName) {
      return res.status(400).send("Nama folder atau file tidak valid.");
    }

    const baseFolder = path.resolve(process.cwd(), "data", "uploaded_file");
    const folderPath = path.resolve(baseFolder, folderName);
    const filePath = path.resolve(folderPath, fileName);

    const relativeFolder = path.relative(baseFolder, folderPath);
    const relativeFile = path.relative(folderPath, filePath);

    if (
      relativeFolder.startsWith("..") ||
      path.isAbsolute(relativeFolder) ||
      relativeFile.startsWith("..") ||
      path.isAbsolute(relativeFile)
    ) {
      return res.status(403).send("Akses file ditolak.");
    }

    await fs.promises.unlink(filePath);

    const updatedFiles = arrayFile.filter((file) => file !== fileName);

    await db.query("UPDATE upload_document SET updated_at = $1, uploaded_files = $2 WHERE id = $3", [date, JSON.stringify(updatedFiles), id]);

    req.flash("success", "Dokumen berhasil dihapus dari server!");
    return res.redirect(`/update_data?id=${id}`);
  } catch (err) {
    console.error("Error pada route delete_file:", err);

    if (err.code === "ENOENT") {
      return res.status(404).send("File fisik tidak ditemukan.");
    }

    res.status(500).send("Terjadi kesalahan pada sistem.");
  }
});
