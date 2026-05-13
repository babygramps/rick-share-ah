import test from 'node:test';
import assert from 'node:assert/strict';

import { parseMarkdownBlocks, parseChartJson } from './chatMarkdown.js';

test('parseMarkdownBlocks recognizes paragraphs, lists, code, links, and emphasis', () => {
  const blocks = parseMarkdownBlocks([
    'Hello **Ada** and _Grace_ with `code` plus [docs](https://example.com).',
    '',
    '- Groceries',
    '- Rent',
    '',
    '```ts',
    'const total = 42;',
    '```',
  ].join('\n'));

  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].type, 'paragraph');
  assert.equal(blocks[1].type, 'list');
  assert.equal(blocks[2].type, 'code');

  if (blocks[0].type !== 'paragraph') return;
  assert.deepEqual(blocks[0].children.map((token) => token.type), ['text', 'strong', 'text', 'emphasis', 'text', 'code', 'text', 'link', 'text']);

  if (blocks[1].type !== 'list') return;
  assert.equal(blocks[1].ordered, false);
  assert.deepEqual(blocks[1].items.map((item) => item[0].text), ['Groceries', 'Rent']);

  if (blocks[2].type !== 'code') return;
  assert.equal(blocks[2].language, 'ts');
  assert.equal(blocks[2].code, 'const total = 42;');
});

test('parseMarkdownBlocks converts valid chart-json fences into chart blocks', () => {
  const blocks = parseMarkdownBlocks([
    '```chart-json',
    JSON.stringify({
      type: 'bar',
      title: 'Spending by category',
      xLabel: 'Category',
      yLabel: 'Dollars',
      data: [
        { label: 'Groceries', value: 120.5 },
        { label: 'Rent', value: 900 },
      ],
    }),
    '```',
  ].join('\n'));

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'chart');

  if (blocks[0].type !== 'chart') return;
  assert.equal(blocks[0].chart.type, 'bar');
  assert.equal(blocks[0].chart.data.length, 2);
  assert.equal(blocks[0].chart.data[0].label, 'Groceries');
});

test('parseChartJson rejects unsafe or unsupported chart payloads', () => {
  assert.equal(parseChartJson('{"type":"scatter","data":[{"label":"A","value":1}]}'), null);
  assert.equal(parseChartJson('{"type":"bar","data":[{"label":"A","value":"1"}]}'), null);
  assert.equal(parseChartJson('{"type":"pie","data":[]}'), null);
});

test('parseMarkdownBlocks does not create links for unsafe hrefs', () => {
  const blocks = parseMarkdownBlocks('[click me](javascript:alert(1)) and <b>raw html</b>');

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'paragraph');

  if (blocks[0].type !== 'paragraph') return;
  assert.equal(blocks[0].children.some((token) => token.type === 'link'), false);
  assert.match(blocks[0].children.map((token) => token.text).join(''), /<b>raw html<\/b>/);
});

test('parseMarkdownBlocks preserves incomplete markdown text instead of dropping it', () => {
  const content = 'Your biggest expense was **$526.16** for **dinner at the nice place';
  const blocks = parseMarkdownBlocks(content);

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'paragraph');

  if (blocks[0].type !== 'paragraph') return;
  assert.equal(blocks[0].children.map((token) => token.text).join(''), content.replace(/\*\*/g, ''));
  assert.equal(blocks[0].children.at(-1)?.text, ' for dinner at the nice place');
});
