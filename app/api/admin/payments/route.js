import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["invoice_id","receipt_no","amount","mode","paid_on","notes"];

export const { GET, POST } = makeCollection({
  table: "payments",
  key: "payments",
  orderBy: [["created_at", "desc"]],
  map: (b) => pickFields(b, FIELDS),
});
