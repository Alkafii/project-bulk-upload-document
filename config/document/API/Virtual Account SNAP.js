import db from "../../database.js";

const result_offUs = await db.query("SELECT document_names FROM document_name WHERE name = 'VA SNAP Off Us'");
export const VIRTUAL_ACCOUNT_OFF_US_DOCUMENT = result_offUs.rows[0]?.document_names || [];

const result_onUs = await db.query("SELECT document_names FROM document_name WHERE name = 'VA SNAP On Us'");
export const VIRTUAL_ACCOUNT_ON_US_DOCUMENT = result_onUs.rows[0]?.document_names || [];