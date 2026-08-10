import type { ReactNode } from 'react';

type Block =
  | { type: 'heading'; level: 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

function inlineMarkdownNodes(text: string): ReactNode[] {
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    const [full, label, href] = match;
    if (index > cursor) nodes.push(text.slice(cursor, index));
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
    cursor = index + full.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length ? nodes : [text];
}

function parseMarkdownBlocks(markdown: string): Block[] {
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
        level: heading[1].length === 2 ? 3 : 4,
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
}: {
  children: string;
  className?: string;
}) {
  const blocks = parseMarkdownBlocks(children);
  if (!blocks.length) return null;

  return (
    <div className={['content-markdown', className].filter(Boolean).join(' ')}>
      {blocks.map((block, index): ReactNode => {
        if (block.type === 'heading') {
          const Heading = `h${block.level}` as 'h3' | 'h4';
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
