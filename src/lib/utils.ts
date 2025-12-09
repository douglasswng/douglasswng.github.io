import { clsx, type ClassValue } from "clsx";
import readingTimeLib from "reading-time";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

export function readingTime(html: string) {
  const { text } = readingTimeLib(html);
  return text;
}

export function dateRange(startDate: Date, endDate?: Date | string): string {
  const startMonth = startDate.toLocaleString("default", { month: "short" });
  const startYear = startDate.getFullYear().toString();
  let endMonth;
  let endYear;

  if (endDate) {
    if (typeof endDate === "string") {
      endMonth = "";
      endYear = endDate;
    } else {
      endMonth = endDate.toLocaleString("default", { month: "short" });
      endYear = endDate.getFullYear().toString();
    }
  }

  return `${startMonth}${startYear} - ${endMonth}${endYear}`;
}

export function extractOverview(markdown: string, maxChars: number = 200): string {
  // First, try to find an explicit Overview section
  let overviewMatch = markdown.match(/## Overview\s*\n\s*(.+?)(?:\n\n|$)/);
  if (overviewMatch && overviewMatch[1]) {
    return overviewMatch[1].trim();
  }
  
  // If no Overview section, extract the first paragraph after frontmatter
  // Remove frontmatter (content between --- markers)
  let content = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
  
  // Remove markdown formatting
  content = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/\$\$[\s\S]*?\$\$/g, '') // Remove block math
    .replace(/\$(.+?)\$/g, '') // Remove inline math
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  // Extract first maxChars characters, breaking at word boundary
  if (content.length <= maxChars) {
    return content;
  }
  
  const truncated = content.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxChars * 0.8) { // Only break at word if we're at least 80% through
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}