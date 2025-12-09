import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    topics: z.array(z.string()).optional(),
    status: z.string().optional(),
  }),
});

export const collections = { blog };
