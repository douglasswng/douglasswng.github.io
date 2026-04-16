import { visit } from "unist-util-visit";

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const icons = {
  pencil: svg(`<line x1="18" y1="2" x2="22" y2="6"></line><path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"></path>`),
  clipboard: svg(`<rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path>`),
  info: svg(`<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`),
  checkCircle: svg(`<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path>`),
  flame: svg(`<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>`),
  check: svg(`<polyline points="20 6 9 17 4 12"></polyline>`),
  helpCircle: svg(`<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>`),
  alertTriangle: svg(`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`),
  x: svg(`<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>`),
  zap: svg(`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>`),
  bug: svg(`<rect width="8" height="14" x="8" y="6" rx="4"></rect><path d="m19 7-3 2"></path><path d="m5 7 3 2"></path><path d="m19 19-3-2"></path><path d="m5 19 3-2"></path><path d="M20 13h-4"></path><path d="M4 13h4"></path><path d="m10 4 1 2"></path><path d="m14 4-1 2"></path>`),
  list: svg(`<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>`),
  quote: svg(`<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>`),
};

const calloutIcons = {
  note: icons.pencil,
  abstract: icons.clipboard, summary: icons.clipboard, tldr: icons.clipboard,
  info: icons.info,
  todo: icons.checkCircle,
  tip: icons.flame, hint: icons.flame, important: icons.flame,
  success: icons.check, check: icons.check, done: icons.check,
  question: icons.helpCircle, help: icons.helpCircle, faq: icons.helpCircle,
  warning: icons.alertTriangle, attention: icons.alertTriangle, caution: icons.alertTriangle,
  failure: icons.x, missing: icons.x, fail: icons.x,
  danger: icons.zap, error: icons.zap,
  bug: icons.bug,
  example: icons.list,
  quote: icons.quote, cite: icons.quote,
};

const HEADER = /^\[\!(\w+)\]([+-]?)\s*(.*)$/;

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function remarkObsidianCallout() {
  return (tree) => {
    visit(tree, "blockquote", (node) => {
      const firstPara = node.children?.[0];
      if (firstPara?.type !== "paragraph") return;
      const firstText = firstPara.children?.[0];
      if (firstText?.type !== "text") return;

      const nl = firstText.value.indexOf("\n");
      const headerLine = nl === -1 ? firstText.value : firstText.value.slice(0, nl);
      const afterHeader = nl === -1 ? "" : firstText.value.slice(nl + 1);

      const match = headerLine.match(HEADER);
      if (!match) return;

      const [, rawType, sign, title] = match;
      const type = rawType.toLowerCase();
      const valid = calloutIcons[type] ? type : "note";
      const icon = calloutIcons[valid];

      const titleHtml =
        `<div class="callout-title">` +
        `<div class="callout-title-icon">${icon}</div>` +
        (title ? `<div class="callout-title-text">${escapeHtml(title)}</div>` : "") +
        `</div>`;
      const titleNode = { type: "html", value: titleHtml };

      const remainingInline = firstPara.children.slice(1);
      const hasBody = afterHeader.length > 0 || remainingInline.length > 0;

      if (hasBody) {
        const bodyChildren = afterHeader
          ? [{ type: "text", value: afterHeader }, ...remainingInline]
          : remainingInline;
        const bodyPara = {
          type: "paragraph",
          children: bodyChildren,
          data: { hProperties: { className: "callout-content" } },
        };
        node.children.splice(0, 1, titleNode, bodyPara);
      } else {
        node.children.splice(0, 1, titleNode);
      }

      node.data = {
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          className: `callout-${valid}`,
          "data-callout": valid,
          "data-expandable": String(Boolean(sign)),
          "data-expanded": String(sign === "+"),
        },
      };
    });
  };
}
