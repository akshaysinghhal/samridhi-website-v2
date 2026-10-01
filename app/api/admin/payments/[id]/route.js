import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["invoice_id","amount","mode","paid_on","notes"];

export const { PUT, DELETE } = makeItem({
  table: "payments",
  map: (b) => pickFields(b, FIELDS),
});
