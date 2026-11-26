client = await db.connect();

// Mulai transaksi database
await client.query("BEGIN");
transactionStarted = true;

// Simpan data integrasi
const integrationResult = await client.query(
    `INSERT INTO upload_document
        (name, api_name, folder_name, created_at, updated_at)
     VALUES
        ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [institution, apiName, folderName]
);

const integrationId = integrationResult.rows[0].id;