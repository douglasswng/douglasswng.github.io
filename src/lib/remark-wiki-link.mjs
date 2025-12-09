import { visit } from 'unist-util-visit';

/**
 * Remark plugin to transform Obsidian-style wiki links [[Page]] to markdown links
 * Converts [[NoteStar]] to [NoteStar](/blog/notestar)
 */
export function remarkWikiLink() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      const text = node.value;
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
      
      if (!wikiLinkRegex.test(text)) {
        return;
      }

      const newNodes = [];
      let lastIndex = 0;
      let match;
      
      // Reset regex
      wikiLinkRegex.lastIndex = 0;
      
      while ((match = wikiLinkRegex.exec(text)) !== null) {
        const beforeText = text.slice(lastIndex, match.index);
        const linkText = match[1];
        
        // Add text before the wiki link
        if (beforeText) {
          newNodes.push({
            type: 'text',
            value: beforeText
          });
        }
        
        // Convert wiki link to markdown link
        // Convert "NoteStar" to "notestar" for URL slug
        const slug = linkText.toLowerCase().replace(/\s+/g, '-');
        
        newNodes.push({
          type: 'link',
          url: `/blog/${slug}`,
          children: [
            {
              type: 'text',
              value: linkText
            }
          ]
        });
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text after last wiki link
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        newNodes.push({
          type: 'text',
          value: remainingText
        });
      }
      
      // Replace the text node with the new nodes
      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
}

