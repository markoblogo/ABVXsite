import { Fragment, type ReactNode } from 'react';
import type { WritingIllustration } from '@/content/types';
import MediaPanel from './MediaPanel';
import { YouTubeFigure, youtubeVideoId } from './YouTubeEmbed';

import {parseInlineMarkdown, parseMarkdownBlocks} from '../lib/markdown-blocks.mjs';

function inlineMarkdownNodes(text: string, baseUrl?: string): ReactNode[] {
  type Node = string | {type: 'a' | 'em' | 'strong' | 'code'; href?: string; children: Node[]};
  const render = (nodes: Node[]): ReactNode[] => nodes.map((node, index) => {
    if (typeof node === 'string') return node;
    const Tag = node.type;
    return <Tag key={index} {...(Tag === 'a' ? {href: node.href, ...(/^(https?:\/\/|mailto:)/i.test(node.href || '') ? {target: '_blank', rel: 'noopener noreferrer'} : {})} : {})}>{render(node.children)}</Tag>;
  });
  return render(parseInlineMarkdown(text, baseUrl));
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
  const renderIllustration = (image: WritingIllustration) => (
    <div className="my-6 writing-illustration" key={image.src}>
      <MediaPanel image={image} title={image.alt} variant="writing" />
      <p className="text-sm">{image.caption}</p>
    </div>
  );

  return (
    <div className={['content-markdown', className].filter(Boolean).join(' ')}>
      {blocks.map((block, index): ReactNode => {
        if (block.type === 'code') return <pre key={`code-${index}`}><code>{block.text}</code></pre>;
        if (block.type === 'separator') return <hr key={`separator-${index}`} className="border-0 border-t border-[var(--line)]" />;
        if (block.type === 'table') return (
          <div key={`table-${index}`} className="markdown-table-scroll" role="region" aria-label={block.headers.join(', ')} tabIndex={0}>
            <table>
              <thead><tr>{block.headers.map((cell, column) => <th key={column} scope="col" style={{ textAlign: block.align[column] }}>{inlineMarkdownNodes(cell)}</th>)}</tr></thead>
              <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, column) => <td key={column} style={{ textAlign: block.align[column] }}>{inlineMarkdownNodes(cell)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
        if (block.type === 'heading') {
          const Heading = `h${block.level}` as 'h2' | 'h3' | 'h4';
          return <Fragment key={`${block.type}-${index}`}>
            <Heading>{inlineMarkdownNodes(block.text)}</Heading>
            {illustrations.filter(image => image.afterHeading === block.text).map(renderIllustration)}
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
          return <Fragment key={`video-${index}`}>
            <YouTubeFigure href={video[2]} title={video[1]} />
            {illustrations.filter(image => image.afterParagraph === block.text).map(renderIllustration)}
          </Fragment>;
        }
        return <Fragment key={`${block.type}-${index}`}>
          <p data-writing-anchor={illustrations.some(image => image.afterParagraph === block.text) ? block.text : undefined}>{inlineMarkdownNodes(block.text)}</p>
          {illustrations.filter(image => image.afterParagraph === block.text).map(renderIllustration)}
        </Fragment>;
      })}
    </div>
  );
}
