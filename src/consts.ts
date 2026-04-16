import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Doug's Blog",
  EMAIL: "douglasswng@gmail.com",
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Doug's personal notes and thoughts.",
};

export const BLOG: Metadata = {
  TITLE: "Notes",
  DESCRIPTION: "A collection of my notes and ideas.",
};

export const SOCIALS: Socials = [
  { 
    NAME: "github",
    HREF: "https://github.com/douglasswng"
  },
  {
    NAME: "linkedin",
    HREF: "https://uk.linkedin.com/in/douglass-wang-3720ba172"
  },
];
