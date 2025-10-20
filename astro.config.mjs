import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { remarkWikiLink } from "./src/lib/remark-wiki-link.mjs";

export default defineConfig({
  site: "https://douglasswng.github.io",
  integrations: [mdx(), sitemap(), tailwind()],
  markdown: {
    remarkPlugins: [remarkWikiLink],
  },
});
