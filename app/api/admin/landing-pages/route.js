import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["slug","service_ref","location","title","h1","intro","faq","sort","status","seo"];

export const { GET, POST } = makeCollection({
  table: "landing_pages",
  key: "pages",
  map: (b) => pickFields(b, FIELDS),
});
