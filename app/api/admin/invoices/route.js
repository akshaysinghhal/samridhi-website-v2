import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["invoice_no","quotation_id","client_name","client_phone","client_email","event_title","event_date","venue","items","discount","gst_percent","notes","status"];

export const { GET, POST } = makeCollection({
  table: "invoices",
  key: "invoices",
  orderBy: [["created_at", "desc"]],
  map: (b) => pickFields(b, FIELDS),
});
