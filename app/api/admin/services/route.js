import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["slug","title","summary","icon","hero_image","items","faq","sort","status","seo"];

export const { GET, POST } = makeCollection({
  table: "services",
  key: "services",
  map: (b) => pickFields(b, FIELDS),
});
