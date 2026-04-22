import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import type { Expense, Settlement, GroupMember } from '../types';

function getClient() {
  return generateClient({ authMode: 'userPool' });
}

export async function fetchAllExpenses(groupId: string): Promise<Expense[]> {
  const client = getClient();
  const all: Expense[] = [];
  let nextToken: string | null = null;
  do {
    const page: any = await client.graphql({
      query: queries.expensesByGroupId,
      variables: { groupId, limit: 500, nextToken },
    });
    const items = page.data?.expensesByGroupId?.items || [];
    all.push(...items);
    nextToken = page.data?.expensesByGroupId?.nextToken ?? null;
  } while (nextToken);
  return all;
}

export async function fetchAllSettlements(groupId: string): Promise<Settlement[]> {
  const client = getClient();
  const all: Settlement[] = [];
  let nextToken: string | null = null;
  do {
    const page: any = await client.graphql({
      query: queries.settlementsByGroupId,
      variables: { groupId, limit: 500, nextToken },
    });
    const items = page.data?.settlementsByGroupId?.items || [];
    all.push(...items);
    nextToken = page.data?.settlementsByGroupId?.nextToken ?? null;
  } while (nextToken);
  return all;
}

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map(csvEscape).join(',');
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

function resolvePaidBy(raw: string | null | undefined, nameByUser: Record<string, string>): string {
  if (!raw) return '';
  if (raw === 'partner1' || raw === 'partner2') return `(legacy) ${raw}`;
  return nameByUser[raw] ?? raw;
}

function sharesReadable(rawShares: string | null | undefined, nameByUser: Record<string, string>): string {
  if (!rawShares) return '';
  try {
    let parsed: any = JSON.parse(rawShares);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (!parsed || typeof parsed !== 'object') return '';
    return Object.entries(parsed)
      .map(([uid, cents]) => `${nameByUser[uid] ?? uid}=${(Number(cents) / 100).toFixed(2)}`)
      .join('; ');
  } catch {
    return '';
  }
}

export function expensesToCsv(expenses: Expense[], members: GroupMember[]): string {
  const nameByUser = Object.fromEntries(members.map((m) => [m.userId, m.name]));
  const sorted = [...expenses].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const rows = sorted.map((e) => ({
    date: e.date,
    description: e.description,
    amount_usd: ((e.amount || 0) / 100).toFixed(2),
    amount_cents: e.amount,
    category: e.category,
    paidBy_name: resolvePaidBy(e.paidBy, nameByUser),
    paidBy_raw: e.paidBy ?? '',
    splitType: e.splitType ?? '',
    shares_readable: sharesReadable(e.shares, nameByUser),
    partner1Share: e.partner1Share ?? '',
    partner2Share: e.partner2Share ?? '',
    shares_json: e.shares ?? '',
    note: e.note ?? '',
    groupId: e.groupId,
    id: e.id,
    createdAt: e.createdAt ?? '',
    updatedAt: e.updatedAt ?? '',
  }));
  return toCsv(rows, [
    'date', 'description', 'amount_usd', 'amount_cents', 'category',
    'paidBy_name', 'paidBy_raw', 'splitType', 'shares_readable',
    'partner1Share', 'partner2Share', 'shares_json', 'note',
    'groupId', 'id', 'createdAt', 'updatedAt',
  ]);
}

export function settlementsToCsv(settlements: Settlement[], members: GroupMember[]): string {
  const nameByUser = Object.fromEntries(members.map((m) => [m.userId, m.name]));
  const sorted = [...settlements].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const rows = sorted.map((s) => ({
    date: s.date,
    amount_usd: ((s.amount || 0) / 100).toFixed(2),
    amount_cents: s.amount,
    paidBy_name: resolvePaidBy(s.paidBy, nameByUser),
    paidTo_name: resolvePaidBy(s.paidTo, nameByUser),
    paidBy_raw: s.paidBy ?? '',
    paidTo_raw: s.paidTo ?? '',
    note: s.note ?? '',
    groupId: s.groupId,
    id: s.id,
    createdAt: s.createdAt ?? '',
  }));
  return toCsv(rows, [
    'date', 'amount_usd', 'amount_cents',
    'paidBy_name', 'paidTo_name', 'paidBy_raw', 'paidTo_raw',
    'note', 'groupId', 'id', 'createdAt',
  ]);
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
