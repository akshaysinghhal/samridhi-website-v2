import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["quote_no","client_name","client_phone","client_email","event_title","event_date","venue","items","discount","gst_percent","notes","status"];

export const { GET, POST } = makeCollection({
  table: "quotations",
  key: "quotations",
  orderBy: [["created_at", "desc"]],
  map: (b) => pickFields(b, FIELDS),
});
