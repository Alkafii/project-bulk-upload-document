import db from "../../database.js";

const result = await db.query("SELECT document_names FROM document_name WHERE name = 'QRIS MPM SNAP'");
export const QRIS_DOCUMENT = result.rows[0]?.document_names || [];

export default QRIS_DOCUMENT;
