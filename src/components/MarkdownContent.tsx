import { Fragment, type ReactNode } from 'react';
import type { WritingIllustration } from '@/content/types';
import MediaPanel from './MediaPanel';
import { YouTubeFigure, youtubeVideoId } from './YouTubeEmbed';

type Block =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; text: string }
  | { type: 'separator' }
  | { type: 'list'; items: string[]; ordered: boolean };

type InlineMatch = {
  index: number;
  end: number;
  code?: string;
  label?: string;
  href?: string;
  strong?: string;
  italic?: string;
  underscoreItalic?: string;
};

function inlineMarkdownNodes(text: string): ReactNode[] {
  const pattern = /`([^`\n]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(\*\*(.+?)\*\*(?!\*))|(__(.+?)__)|(\*(.+?)\*)/g;
  const regularMatches: InlineMatch[] = Array.from(text.matchAll(pattern), (match) => {
    const [full, code, label, href, , boldA, , boldB, , italic] = match;
    return {
      index: match.index ?? 0,
      end: (match.index ?? 0) + full.length,
      ...(code ? { code } : {}),
      ...(label ? { label } : {}),
      ...(href ? { href } : {}),
      ...((boldA || boldB) ? { strong: boldA || boldB } : {}),
      ...(italic ? { italic } : {}),
    };
  });
  const underscoreMatches: InlineMatch[] = [];
  let openUnderscore = -1;
  const characters = Array.from(text);
  const isWord = (character: string | undefined) =>
    character !== undefined && /[\p{L}\p{N}_]/u.test(character);

  let offset = 0;
  for (let characterIndex = 0; characterIndex < characters.length; characterIndex += 1) {
    const index = offset;
    const character = characters[characterIndex];
    offset += character.length;
    if (character !== '_' || characters[characterIndex - 1] === '_' || characters[characterIndex + 1] === '_') continue;

    const previous = characters[characterIndex - 1];
    const next = characters[characterIndex + 1];
    const canOpen = !isWord(previous) && next !== undefined && !/\s/u.test(next);
    const canClose = previous !== undefined && !/\s/u.test(previous) && !isWord(next);

    if (canClose && openUnderscore >= 0) {
      const content = text.slice(openUnderscore + 1, index);
      if (content && !/^\s|\s$/u.test(content)) {
        underscoreMatches.push({
          index: openUnderscore,
          end: index + 1,
          underscoreItalic: content,
        });
        openUnderscore = -1;
        continue;
      }
    }

    if (canOpen) openUnderscore = index;
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;
  let regularIndex = 0;
  let underscoreIndex = 0;

  while (regularIndex < regularMatches.length || underscoreIndex < underscoreMatches.length) {
    const regular = regularMatches[regularIndex];
    const underscore = underscoreMatches[underscoreIndex];
    const match = !underscore || (regular && regular.index <= underscore.index) ? regular : underscore;
    if (!match) break;
    if (match === regular) regularIndex += 1;
    else underscoreIndex += 1;

    const { index, end, code, label, href, strong, italic, underscoreItalic } = match;
    if (index < cursor) continue;
    if (index > cursor) nodes.push(text.slice(cursor, index));
    if (code) {
      nodes.push(<code key={`inline-code-${index}`}>{code}</code>);
    } else if (href) {
      const external = /^(https?:\/\/|mailto:)/i.test(href);
      nodes.push(
        <a
          key={`link-${index}-${href}`}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {inlineMarkdownNodes(label || href)}
        </a>,
      );
    } else if (strong) {
      nodes.push(<strong key={`strong-${index}`}>{inlineMarkdownNodes(strong)}</strong>);
    } else if (italic || underscoreItalic) {
      nodes.push(<em key={`em-${index}`}>{inlineMarkdownNodes(italic || underscoreItalic || '')}</em>);
    }
    cursor = end;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length ? nodes : [text];
}

function parseMarkdownBlocks(markdown: string, headingOffset: 0 | 1): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let list: string[] = [];
  let orderedList = false;
  let code: string[] | null = null;

  function flushParagraph() {
    if (!paragraph.length) return;
    blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    blocks.push({ type: 'list', items: list, ordered: orderedList });
    list = [];
    orderedList = false;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^```[\w-]*$/.test(line) && (code === null || line === '```')) {
      flushParagraph();
      flushList();
      if (code !== null) {
        blocks.push({ type: 'code', text: code.join('\n') });
        code = null;
      } else code = [];
      continue;
    }
    if (code !== null) {
      code.push(rawLine);
      continue;
    }

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

    if (/^(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'separator' });
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextIsOrdered = Boolean(ordered);
      if (list.length && orderedList !== nextIsOrdered) flushList();
      if (!list.length) orderedList = nextIsOrdered;
      list.push((ordered || unordered)![1].trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  if (code !== null) blocks.push({ type: 'code', text: code.join('\n') });
  return blocks;
}

export default function MarkdownContent({
  children,
  className,
  headingOffset = 1,
  embedVideos = false,
  illustrations = [],
}: {
  children: string;
  className?: string;
  headingOffset?: 0 | 1;
  embedVideos?: boolean;
  illustrations?: WritingIllustration[];
}) {
  const blocks = parseMarkdownBlocks(children, headingOffset);
  if (!blocks.length) return null;

  return (
    <div className={['content-markdown', className].filter(Boolean).join(' ')}>
      {blocks.map((block, index): ReactNode => {
        if (block.type === 'code') return <pre key={`code-${index}`}><code>{block.text}</code></pre>;
        if (block.type === 'separator') return <hr key={`separator-${index}`} className="border-0 border-t border-[var(--line)]" />;
        if (block.type === 'heading') {
          const Heading = `h${block.level}` as 'h2' | 'h3' | 'h4';
          return <Fragment key={`${block.type}-${index}`}>
            <Heading>{inlineMarkdownNodes(block.text)}</Heading>
            {illustrations.filter(image => image.afterHeading === block.text).map(image => (
              <div className="my-6 writing-illustration" key={image.src}>
                <MediaPanel image={image} title={image.alt} variant="writing" />
                <p className="text-sm">{image.caption}</p>
              </div>
            ))}
          </Fragment>;
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{inlineMarkdownNodes(item)}</li>
              ))}
            </ListTag>
          );
        }

        // Only an entire labelled link paragraph opts into video rendering.
        // Inline links, lists and code examples keep ordinary Markdown behavior.
        const video = embedVideos ? block.text.match(/^\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)$/) : null;
        if (video && youtubeVideoId(video[2])) {
          return <YouTubeFigure key={`video-${index}`} href={video[2]} title={video[1]} />;
        }
        return <p key={`${block.type}-${index}`}>{inlineMarkdownNodes(block.text)}</p>;
      })}
    </div>
  );
}
