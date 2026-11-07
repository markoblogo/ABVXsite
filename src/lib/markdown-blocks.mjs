/** Shared, non-HTML Markdown grammar for page and feed renderers.
 * @typedef {string | {type: 'a'|'em'|'strong'|'code', href?: string, children: InlineNode[]}} InlineNode
 * @typedef {{type:'heading',level:2|3|4,text:string}|{type:'paragraph'|'code',text:string}|{type:'separator'}|{type:'table',headers:string[],rows:string[][],align:('left'|'center'|'right'|undefined)[]}|{type:'list',items:string[],ordered:boolean}} Block
 */
/** @returns {InlineNode[]} */
function parseInlineMarkdown(text, baseUrl) {
    const pattern = /`([^`\n]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(\*\*(.+?)\*\*(?!\*))|(__(.+?)__)|(\*(.+?)\*)/g;
    const regularMatches = Array.from(text.matchAll(pattern), (match) => {
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
    const underscoreMatches = [];
    let openUnderscore = -1;
    const characters = Array.from(text);
    const isWord = (character) => character !== undefined && /[\p{L}\p{N}_]/u.test(character);
    let offset = 0;
    for (let characterIndex = 0; characterIndex < characters.length; characterIndex += 1) {
        const index = offset;
        const character = characters[characterIndex];
        offset += character.length;
        if (character !== '_' || characters[characterIndex - 1] === '_' || characters[characterIndex + 1] === '_')
            continue;
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
        if (canOpen)
            openUnderscore = index;
    }
    const nodes = [];
    let cursor = 0;
    let regularIndex = 0;
    let underscoreIndex = 0;
    while (regularIndex < regularMatches.length || underscoreIndex < underscoreMatches.length) {
        const regular = regularMatches[regularIndex];
        const underscore = underscoreMatches[underscoreIndex];
        const match = !underscore || (regular && regular.index <= underscore.index) ? regular : underscore;
        if (!match)
            break;
        if (match === regular)
            regularIndex += 1;
        else
            underscoreIndex += 1;
        const { index, end, code, label, href, strong, italic, underscoreItalic } = match;
        if (index < cursor)
            continue;
        if (index > cursor)
            nodes.push(text.slice(cursor, index));
        if (code) {
            nodes.push({ type: 'code', children: [code] });
        }
        else if (href) {
            let resolved = href;
            if (baseUrl) {
                try {
                    const url = new URL(href, baseUrl);
                    resolved = /^(https?:|mailto:)$/.test(url.protocol) ? url.href : '';
                }
                catch {
                    resolved = '';
                }
            }
            nodes.push({ type: 'a', href: resolved || undefined, children: parseInlineMarkdown(label || href, baseUrl) });
        }
        else if (strong) {
            nodes.push({ type: 'strong', children: parseInlineMarkdown(strong, baseUrl) });
        }
        else if (italic || underscoreItalic) {
            nodes.push({ type: 'em', children: parseInlineMarkdown(italic || underscoreItalic || '', baseUrl) });
        }
        cursor = end;
    }
    if (cursor < text.length)
        nodes.push(text.slice(cursor));
    return nodes.length ? nodes : [text];
}
function tableCells(line) {
    const cells = [];
    let cell = '';
    let separators = 0;
    for (let i = 0; i < line.length; i += 1) {
        if (line[i] === '\\' && i + 1 < line.length) {
            cell += line[i + 1] === '|' ? '|' : line.slice(i, i + 2);
            i += 1;
        }
        else if (line[i] === '`') {
            const ticks = line.slice(i).match(/^`+/)[0];
            const end = line.indexOf(ticks, i + ticks.length);
            if (end >= 0) {
                cell += line.slice(i, end + ticks.length);
                i = end + ticks.length - 1;
            }
            else
                cell += line[i];
        }
        else if (line[i] === '|') {
            cells.push(cell.trim());
            cell = '';
            separators += 1;
        }
        else
            cell += line[i];
    }
    if (!separators)
        return null;
    cells.push(cell.trim());
    if (line.startsWith('|'))
        cells.shift();
    if (line.endsWith('|') && cells.at(-1) === '')
        cells.pop();
    return cells;
}
/** @returns {Block[]} */
function parseMarkdownBlocks(markdown, headingOffset) {
    const blocks = [];
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    let paragraph = [];
    let list = [];
    let orderedList = false;
    let code = null;
    function flushParagraph() {
        if (!paragraph.length)
            return;
        blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
        paragraph = [];
    }
    function flushList() {
        if (!list.length)
            return;
        blocks.push({ type: 'list', items: list, ordered: orderedList });
        list = [];
        orderedList = false;
    }
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const rawLine = lines[lineIndex];
        const line = rawLine.trim();
        if (/^```[\w-]*$/.test(line) && (code === null || line === '```')) {
            flushParagraph();
            flushList();
            if (code !== null) {
                blocks.push({ type: 'code', text: code.join('\n') });
                code = null;
            }
            else
                code = [];
            continue;
        }
        if (code !== null) {
            code.push(rawLine);
            continue;
        }
        const headers = tableCells(line);
        const delimiter = tableCells((lines[lineIndex + 1] || '').trim());
        if (headers?.length && delimiter?.length === headers.length && delimiter.every(cell => /^:?-{3,}:?$/.test(cell))) {
            flushParagraph();
            flushList();
            const align = delimiter.map(cell => cell.endsWith(':') ? (cell.startsWith(':') ? 'center' : 'right') : cell.startsWith(':') ? 'left' : undefined);
            const rows = [];
            lineIndex += 1;
            while (lineIndex + 1 < lines.length) {
                const nextLine = lines[lineIndex + 1].trim();
                if (/^(?:#{1,6}\s|```|>\s?|[-*+]\s|\d+[.)]\s)/.test(nextLine))
                    break;
                const row = tableCells(nextLine);
                if (!row)
                    break;
                rows.push(headers.map((_, index) => row[index] || ''));
                lineIndex += 1;
            }
            blocks.push({ type: 'table', headers, rows, align });
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
                level: Math.min(4, heading[1].length + headingOffset),
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
            if (list.length && orderedList !== nextIsOrdered)
                flushList();
            if (!list.length)
                orderedList = nextIsOrdered;
            list.push((ordered || unordered)[1].trim());
            continue;
        }
        flushList();
        paragraph.push(line);
    }
    flushParagraph();
    flushList();
    if (code !== null)
        blocks.push({ type: 'code', text: code.join('\n') });
    return blocks;
}
export { parseInlineMarkdown, parseMarkdownBlocks };
