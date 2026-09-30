import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["slug","title","summary","icon","hero_image","items","faq","sort","status","seo"];

export const { PUT, DELETE } = makeItem({
  table: "services",
  map: (b) => pickFields(b, FIELDS),
});
