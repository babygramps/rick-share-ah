export type ChartType = 'bar' | 'line' | 'pie';

export interface ChatChartDataPoint {
  label: string;
  value: number;
}

export interface ChatChart {
  type: ChartType;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  data: ChatChartDataPoint[];
}

export type InlineToken =
  | { type: 'text'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'emphasis'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

export type MarkdownBlock =
  | { type: 'paragraph'; children: InlineToken[] }
  | { type: 'list'; ordered: boolean; items: InlineToken[][] }
  | { type: 'code'; language: string; code: string }
  | { type: 'chart'; chart: ChatChart };

const MAX_CHART_POINTS = 24;
const MAX_LABEL_LENGTH = 64;
const SAFE_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

export function isSafeHref(href: string) {
  try {
    const parsed = new URL(href, 'https://rickandshareah.local');
    return SAFE_LINK_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function parseChartJson(raw: string): ChatChart | null {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(payload)) return null;
  const type = payload.type;
  if (type !== 'bar' && type !== 'line' && type !== 'pie') return null;
  if (!Array.isArray(payload.data) || payload.data.length === 0 || payload.data.length > MAX_CHART_POINTS) {
    return null;
  }

  const data = payload.data.map((point) => {
    if (!isRecord(point)) return null;
    const label = cleanString(point.label, MAX_LABEL_LENGTH);
    const value = point.value;
    if (!label || typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
    return { label, value };
  });

  if (data.some((point) => point === null)) return null;

  return {
    type,
    title: cleanString(payload.title, 96),
    xLabel: cleanString(payload.xLabel, 48),
    yLabel: cleanString(payload.yLabel, 48),
    data: data as ChatChartDataPoint[],
  };
}

function pushText(tokens: InlineToken[], text: string) {
  if (!text) return;
  const cleaned = text.replace(/\*\*/g, '').replace(/(?<!\w)[*_](?!\w)/g, '');
  const last = tokens.at(-1);
  if (last?.type === 'text') {
    last.text += cleaned;
    return;
  }
  tokens.push({ type: 'text', text: cleaned });
}

export function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+?\*\*|\[[^\]\n]+\]\([^) \n]+?\)|_[^_\n]+?_|\*[^*\n]+?\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    pushText(tokens, text.slice(cursor, match.index));
    const raw = match[0];

    if (raw.startsWith('`')) {
      tokens.push({ type: 'code', text: raw.slice(1, -1) });
    } else if (raw.startsWith('**')) {
      tokens.push({ type: 'strong', text: raw.slice(2, -2) });
    } else if (raw.startsWith('[')) {
      const linkMatch = /^\[([^\]\n]+)\]\(([^) \n]+)\)$/.exec(raw);
      const label = linkMatch?.[1] ?? raw;
      const href = linkMatch?.[2] ?? '';
      if (href && isSafeHref(href)) {
        tokens.push({ type: 'link', text: label, href });
      } else {
        pushText(tokens, label);
      }
    } else {
      tokens.push({ type: 'emphasis', text: raw.slice(1, -1) });
    }

    cursor = match.index + raw.length;
  }

  pushText(tokens, text.slice(cursor));
  return tokens.length ? tokens : [{ type: 'text', text: '' }];
}

function isFenceStart(line: string) {
  return /^```[A-Za-z0-9_-]*\s*$/.test(line);
}

function parseListLine(line: string) {
  const match = /^\s*((?:[-*+])|(?:\d+[.)]))\s+(.+)$/.exec(line);
  if (!match) return null;
  return {
    ordered: /\d/.test(match[1]),
    text: match[2],
  };
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (isFenceStart(line)) {
      const language = line.replace(/^```/, '').trim().toLowerCase();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;

      const code = codeLines.join('\n');
      if (language === 'chart-json') {
        const chart = parseChartJson(code);
        if (chart) {
          blocks.push({ type: 'chart', chart });
          continue;
        }
      }

      blocks.push({ type: 'code', language, code });
      continue;
    }

    const listLine = parseListLine(line);
    if (listLine) {
      const ordered = listLine.ordered;
      const items: InlineToken[][] = [];
      while (index < lines.length) {
        const nextListLine = parseListLine(lines[index]);
        if (!nextListLine || nextListLine.ordered !== ordered) break;
        items.push(parseInlineMarkdown(nextListLine.text));
        index += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && lines[index].trim() && !isFenceStart(lines[index]) && !parseListLine(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', children: parseInlineMarkdown(paragraphLines.join(' ')) });
  }

  return blocks;
}
