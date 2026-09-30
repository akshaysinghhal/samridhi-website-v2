import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["slug","service_ref","location","title","h1","intro","faq","sort","status","seo"];

export const { PUT, DELETE } = makeItem({
  table: "landing_pages",
  map: (b) => pickFields(b, FIELDS),
});
