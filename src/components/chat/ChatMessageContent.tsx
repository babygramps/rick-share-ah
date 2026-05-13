import { useMemo, type ReactNode } from 'react';
import { parseMarkdownBlocks, type ChatChart, type InlineToken, type MarkdownBlock } from '../../utils/chatMarkdown';

const CHART_COLORS = [
  'var(--color-coral)',
  'var(--color-sage)',
  'var(--color-sunshine)',
  'var(--color-sky)',
  'var(--color-lavender)',
  'var(--color-plum)',
];

interface ChatMessageContentProps {
  content: string;
}

function renderInline(tokens: InlineToken[], keyPrefix: string): ReactNode {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (token.type) {
      case 'strong':
        return <strong key={key} className="font-bold">{token.text}</strong>;
      case 'emphasis':
        return <em key={key}>{token.text}</em>;
      case 'code':
        return (
          <code key={key} className="rounded-sm bg-[var(--color-plum)]/10 px-1 py-0.5 font-mono text-[0.85em]">
            {token.text}
          </code>
        );
      case 'link':
        return (
          <a
            key={key}
            href={token.href}
            target="_blank"
            rel="noreferrer"
            className="font-bold underline decoration-2 underline-offset-2 hover:text-[var(--color-coral)]"
          >
            {token.text}
          </a>
        );
      case 'text':
        return token.text;
    }
  });
}

function formatChartValue(value: number) {
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function BarChart({ chart }: { chart: ChatChart }) {
  const maxValue = Math.max(...chart.data.map((point) => point.value), 1);
  const width = 320;
  const height = 180;
  const left = 42;
  const bottom = 40;
  const plotWidth = width - left - 16;
  const plotHeight = height - 28 - bottom;
  const gap = 8;
  const barWidth = Math.max(10, (plotWidth - gap * (chart.data.length - 1)) / chart.data.length);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title || 'Bar chart'} className="w-full">
      <line x1={left} y1={height - bottom} x2={width - 10} y2={height - bottom} stroke="var(--color-plum)" strokeWidth="2" />
      <line x1={left} y1="18" x2={left} y2={height - bottom} stroke="var(--color-plum)" strokeWidth="2" />
      {chart.data.map((point, index) => {
        const barHeight = (point.value / maxValue) * plotHeight;
        const x = left + index * (barWidth + gap);
        const y = height - bottom - barHeight;
        return (
          <g key={point.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              stroke="var(--color-plum)"
              strokeWidth="2"
            />
            <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="fill-[var(--color-plum)] text-[10px] font-mono">
              {formatChartValue(point.value)}
            </text>
            <text x={x + barWidth / 2} y={height - 20} textAnchor="middle" className="fill-[var(--color-plum)] text-[9px] font-mono">
              {point.label.slice(0, 10)}
            </text>
          </g>
        );
      })}
      {chart.yLabel && <text x="6" y="14" className="fill-[var(--color-plum)] text-[10px] font-mono">{chart.yLabel}</text>}
      {chart.xLabel && <text x={width - 70} y={height - 4} className="fill-[var(--color-plum)] text-[10px] font-mono">{chart.xLabel}</text>}
    </svg>
  );
}

function LineChart({ chart }: { chart: ChatChart }) {
  const maxValue = Math.max(...chart.data.map((point) => point.value), 1);
  const width = 320;
  const height = 180;
  const left = 42;
  const bottom = 40;
  const plotWidth = width - left - 16;
  const plotHeight = height - 28 - bottom;
  const points = chart.data.map((point, index) => {
    const x = left + (chart.data.length === 1 ? plotWidth / 2 : (index / (chart.data.length - 1)) * plotWidth);
    const y = height - bottom - (point.value / maxValue) * plotHeight;
    return { ...point, x, y };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title || 'Line chart'} className="w-full">
      <line x1={left} y1={height - bottom} x2={width - 10} y2={height - bottom} stroke="var(--color-plum)" strokeWidth="2" />
      <line x1={left} y1="18" x2={left} y2={height - bottom} stroke="var(--color-plum)" strokeWidth="2" />
      <polyline
        points={points.map((point) => `${point.x},${point.y}`).join(' ')}
        fill="none"
        stroke="var(--color-coral)"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((point, index) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="5" fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--color-plum)" strokeWidth="2" />
          <text x={point.x} y={point.y - 10} textAnchor="middle" className="fill-[var(--color-plum)] text-[10px] font-mono">
            {formatChartValue(point.value)}
          </text>
          <text x={point.x} y={height - 20} textAnchor="middle" className="fill-[var(--color-plum)] text-[9px] font-mono">
            {point.label.slice(0, 10)}
          </text>
        </g>
      ))}
      {chart.yLabel && <text x="6" y="14" className="fill-[var(--color-plum)] text-[10px] font-mono">{chart.yLabel}</text>}
      {chart.xLabel && <text x={width - 70} y={height - 4} className="fill-[var(--color-plum)] text-[10px] font-mono">{chart.xLabel}</text>}
    </svg>
  );
}

function describePieSlice(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = {
    x: cx + radius * Math.cos(startAngle),
    y: cy + radius * Math.sin(startAngle),
  };
  const end = {
    x: cx + radius * Math.cos(endAngle),
    y: cy + radius * Math.sin(endAngle),
  };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function PieChart({ chart }: { chart: ChatChart }) {
  const total = chart.data.reduce((sum, point) => sum + point.value, 0);
  let cursor = -Math.PI / 2;

  return (
    <svg viewBox="0 0 320 190" role="img" aria-label={chart.title || 'Pie chart'} className="w-full">
      {total > 0 && chart.data.map((point, index) => {
        const angle = (point.value / total) * Math.PI * 2;
        const path = describePieSlice(92, 88, 64, cursor, cursor + angle);
        cursor += angle;
        return (
          <path
            key={point.label}
            d={path}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            stroke="var(--color-plum)"
            strokeWidth="2"
          />
        );
      })}
      <g>
        {chart.data.map((point, index) => (
          <g key={point.label} transform={`translate(180 ${28 + index * 24})`}>
            <rect width="14" height="14" fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--color-plum)" strokeWidth="2" />
            <text x="22" y="12" className="fill-[var(--color-plum)] text-[11px] font-mono">
              {point.label.slice(0, 18)} ({formatChartValue(point.value)})
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function ChartBlock({ chart }: { chart: ChatChart }) {
  return (
    <figure className="my-3 border-2 border-[var(--color-plum)] bg-[var(--color-cream)] p-3">
      {chart.title && (
        <figcaption className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-plum)]">
          {chart.title}
        </figcaption>
      )}
      {chart.type === 'bar' && <BarChart chart={chart} />}
      {chart.type === 'line' && <LineChart chart={chart} />}
      {chart.type === 'pie' && <PieChart chart={chart} />}
    </figure>
  );
}

function renderBlock(block: MarkdownBlock, index: number) {
  switch (block.type) {
    case 'paragraph':
      return <p key={index}>{renderInline(block.children, `p-${index}`)}</p>;
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={index} className={`space-y-1 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `li-${index}-${itemIndex}`)}</li>
          ))}
        </ListTag>
      );
    }
    case 'code':
      return (
        <pre key={index} className="overflow-x-auto border-2 border-[var(--color-plum)] bg-[var(--color-plum)]/10 p-3 text-xs">
          <code>{block.code}</code>
        </pre>
      );
    case 'chart':
      return <ChartBlock key={index} chart={block.chart} />;
  }
}

export function ChatMessageContent({ content }: ChatMessageContentProps) {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className="space-y-2 whitespace-normal break-words font-mono leading-relaxed">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
