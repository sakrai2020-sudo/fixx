import { writeFileSync } from "node:fs";
import { getCatalogSeedRows } from "../src/lib/providers-list.ts";

const rows = getCatalogSeedRows();
const esc = (s) => s.replace(/'/g, "''");
const sql = [
  "-- Replace short providers catalog with full list",
  "DELETE FROM public.providers;",
  "INSERT INTO public.providers (name, category, logo_emoji) VALUES",
  rows.map((r) => `('${esc(r.name)}','${esc(r.category)}','${esc(r.logo_emoji)}')`).join(",\n") + ";",
  "",
].join("\n");

writeFileSync("supabase/migrations/20260616000000_providers_catalog_full.sql", sql);
console.log(`wrote ${rows.length} rows`);
