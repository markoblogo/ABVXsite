import {parseInlineMarkdown, parseMarkdownBlocks} from './markdown-blocks.mjs';
import {xmlEscape as escape} from './rss.mjs';

const inline = (text, baseUrl) => {
  const render = nodes => nodes.map(node => typeof node === 'string' ? escape(node)
    : `<${node.type}${node.type === 'a' && node.href ? ` href="${escape(node.href)}"` : ''}>${render(node.children)}</${node.type}>`).join('');
  return render(parseInlineMarkdown(text, baseUrl));
};
export function feedImage(image, baseUrl, caption) {
  if (!image) return '';
  const url = new URL(image.src, baseUrl);
  if (!['https:', 'http:'].includes(url.protocol)) return '';
  return `<figure><img src="${escape(url.href)}" alt="${escape(image.alt)}"${image.width ? ` width="${Number(image.width)}"` : ''}${image.height ? ` height="${Number(image.height)}"` : ''}/>${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>`;
}
/** Kitchen Notes render this structured section after the authored Markdown. */
export function renderFeedRecipe(recipe) {
  if (!recipe) return '';
  return `<section><h2>Recipe at a glance</h2><p>${escape(recipe.recipeYield)}${recipe.timingText ? '. ' + escape(recipe.timingText) : ''}</p>
<h3>Ingredients</h3><ul>${recipe.ingredients.map(item => `<li>${escape(item.quantityText)} ${escape(item.name)}</li>`).join('')}</ul>
<h3>Method</h3><ol>${recipe.instructions.map(step => `<li>${escape(step)}</li>`).join('')}</ol>
${recipe.variations?.length ? `<h3>Variations</h3><ul>${recipe.variations.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : ''}</section>`;
}
/** Same blocks, inline tokens and illustration anchors as the article renderer. */
export function renderFeedMarkdown(body, baseUrl, illustrations = []) {
  return parseMarkdownBlocks(body, 0).map(block => {
    const images = illustrations.filter(image => (block.type === 'heading' && image.afterHeading === block.text)
      || (block.type === 'paragraph' && image.afterParagraph === block.text)).map(image => feedImage(image, baseUrl, image.caption)).join('');
    if (block.type === 'heading') return `<h${block.level}>${inline(block.text, baseUrl)}</h${block.level}>` + images;
    if (block.type === 'code') return `<pre><code>${escape(block.text)}</code></pre>`;
    if (block.type === 'separator') return '<hr/>';
    if (block.type === 'list') { const tag = block.ordered ? 'ol' : 'ul'; return `<${tag}>${block.items.map(item => `<li>${inline(item, baseUrl)}</li>`).join('')}</${tag}>`; }
    if (block.type === 'table') return `<table><thead><tr>${block.headers.map(cell => `<th scope="col">${inline(cell, baseUrl)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row => `<tr>${row.map(cell => `<td>${inline(cell, baseUrl)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    return `<p>${inline(block.text, baseUrl)}</p>` + images;
  }).join('\n');
}
