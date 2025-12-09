import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { HOME } from "@consts";
import { extractOverview } from "@lib/utils";

type Context = {
  site: string
}

export async function GET(context: Context) {
  const blog = (await getCollection("blog"))
    .map(post => ({
      ...post,
      overview: extractOverview(post.body)
    }))
    .sort((a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf());

  return rss({
    title: HOME.TITLE,
    description: HOME.DESCRIPTION,
    site: context.site,
    items: blog.map((post) => ({
      title: post.data.title,
      description: post.overview || "",
      pubDate: post.data.date,
      link: `/blog/${post.slug}/`,
    })),
  });
}
