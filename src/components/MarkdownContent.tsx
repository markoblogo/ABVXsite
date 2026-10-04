import type { ReactNode } from 'react';

type Block =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

function inlineMarkdownNodes(text: string): ReactNode[] {
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)|(_(.+?)_)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    const [full, label, href, , boldA, , boldB, , italicA, , italicB] = match;
    if (index > cursor) nodes.push(text.slice(cursor, index));
    if (href) {
      const external = /^(https?:\/\/|mailto:)/i.test(href);
      nodes.push(
        <a
          key={`link-${index}-${href}`}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {label}
        </a>,
      );
    } else if (boldA || boldB) {
      nodes.push(<strong key={`strong-${index}`}>{boldA || boldB}</strong>);
    } else if (italicA || italicB) {
      nodes.push(<em key={`em-${index}`}>{italicA || italicB}</em>);
    }
    cursor = index + full.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length ? nodes : [text];
}

function parseMarkdownBlocks(markdown: string, headingOffset: 0 | 1): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let list: string[] = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    blocks.push({ type: 'list', items: list });
    list = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: Math.min(4, heading[1].length + headingOffset) as 2 | 3 | 4,
        text: heading[2].trim(),
      });
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      list.push(unordered[1].trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export default function MarkdownContent({
  children,
  className,
  headingOffset = 1,
}: {
  children: string;
  className?: string;
  headingOffset?: 0 | 1;
}) {
  const blocks = parseMarkdownBlocks(children, headingOffset);
  if (!blocks.length) return null;

  return (
    <div className={['content-markdown', className].filter(Boolean).join(' ')}>
      {blocks.map((block, index): ReactNode => {
        if (block.type === 'heading') {
          const Heading = `h${block.level}` as 'h2' | 'h3' | 'h4';
          return <Heading key={`${block.type}-${index}`}>{inlineMarkdownNodes(block.text)}</Heading>;
        }

        if (block.type === 'list') {
          return (
            <ul key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{inlineMarkdownNodes(item)}</li>
              ))}
            </ul>
          );
        }

        return <p key={`${block.type}-${index}`}>{inlineMarkdownNodes(block.text)}</p>;
      })}
    </div>
  );
}
