/**
 * Split free text into plain-text and link tokens so a renderer can turn the
 * links into clickable anchors. Kept pure (no JSX) so it's trivially testable.
 *
 * Recognizes two forms:
 *  - markdown links `[label](https://…)` → a link whose visible text is `label`;
 *  - bare http(s) URLs → a link whose visible text is the URL itself. A trailing
 *    sentence punctuation mark (.,;:!?) or closing bracket is left out of the
 *    link so "see https://x.com." doesn't swallow the period.
 */
export type LinkToken =
  | { type: "text"; value: string }
  | { type: "link"; href: string; label: string };

// Either a markdown link [label](url), or a bare http(s) URL.
const TOKEN_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s]+/g;

export function linkify(text: string): LinkToken[] {
  const tokens: LinkToken[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, start) });
    }
    if (match[1] && match[2]) {
      // Markdown link: [label](url)
      tokens.push({ type: "link", href: match[2], label: match[1] });
    } else {
      // Bare URL — keep trailing punctuation/brackets out of the link.
      let url = match[0];
      const trail = url.match(/[).,;:!?\]]+$/)?.[0] ?? "";
      if (trail) url = url.slice(0, url.length - trail.length);
      tokens.push({ type: "link", href: url, label: url });
      if (trail) tokens.push({ type: "text", value: trail });
    }
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }
  return tokens;
}
