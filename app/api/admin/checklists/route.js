import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["event_title","event_date","client_name","items"];

export const { GET, POST } = makeCollection({
  table: "event_checklists",
  key: "checklists",
  orderBy: [["created_at", "desc"]],
  map: (b) => pickFields(b, FIELDS),
});
