import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["event_title","event_date","client_name","items"];

export const { PUT, DELETE } = makeItem({
  table: "event_checklists",
  map: (b) => pickFields(b, FIELDS),
});
