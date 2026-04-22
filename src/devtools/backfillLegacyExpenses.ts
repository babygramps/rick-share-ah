// One-off backfill: repairs legacy expense rows so calculateGroupBalance sees them.
// Run once via the browser console: await __backfillLegacyExpenses()
// Delete this file and its wiring in main.tsx once done.
//
// Fixes three shapes the app gets wrong:
//   A) paidBy = "partner1"/"partner2" AND no shares  -> rewrite paidBy to real userId, build shares
//   B) paidBy = "partner1"/"partner2" AND has shares -> rewrite paidBy only
//   C) real userId paidBy AND no shares but partner1Share/2 defined -> build shares (equal split)

import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

type LegacyExpense = {
  id: string;
  amount: number;
  paidBy: string;
  splitType?: string | null;
  partner1Share?: number | null;
  partner2Share?: number | null;
  // AppSync may return `shares` as a string (AWSJSON) or as an object depending on how it was written.
  shares?: string | Record<string, number> | null;
};

type Member = { userId: string; name?: string };

function parsedShares(e: LegacyExpense): Record<string, number> | null {
  const s = e.shares;
  if (s == null) return null;
  if (typeof s === 'object') {
    const keys = Object.keys(s);
    if (keys.length === 0) return null;
    return s as Record<string, number>;
  }
  if (typeof s === 'string') {
    if (!s.trim()) return null;
    try {
      let parsed: unknown = JSON.parse(s);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed as object).length > 0) {
        return parsed as Record<string, number>;
      }
    } catch {
      /* fall through */
    }
  }
  return null;
}

function equalSplit(amount: number, payerId: string, otherId: string): Record<string, number> {
  // Payer absorbs the odd cent so shares sum exactly to amount.
  const half = Math.floor(amount / 2);
  const remainder = amount - half * 2;
  return { [payerId]: half + remainder, [otherId]: half };
}

export async function backfillLegacyExpenses() {
  const client = generateClient({ authMode: 'userPool' });

  const currentUser = await getCurrentUser();
  const userId = currentUser.userId;
  console.info('[backfill] signed in as', userId);

  const membershipResult: any = await client.graphql({
    query: queries.listGroupMembers,
    variables: { filter: { userId: { eq: userId } } },
  });
  const memberships = membershipResult.data?.listGroupMembers?.items || [];
  if (memberships.length === 0) throw new Error('No group membership found for current user.');

  const groupId: string = memberships[0].groupId;
  console.info('[backfill] group', groupId);

  const groupMembersResult: any = await client.graphql({
    query: queries.listGroupMembers,
    variables: { filter: { groupId: { eq: groupId } } },
  });
  const members: Member[] = groupMembersResult.data?.listGroupMembers?.items || [];
  if (members.length !== 2) {
    throw new Error(`Backfill expects exactly 2 members in the group, found ${members.length}.`);
  }
  const [p1, p2] = members;
  const memberIds = new Set([p1.userId, p2.userId]);
  console.info('[backfill] members', { partner1: p1.userId, partner2: p2.userId });

  // Page through expenses
  const all: LegacyExpense[] = [];
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
  console.info('[backfill] total expenses in group', all.length);

  let updatedPaidByOnly = 0;
  let updatedBuiltShares = 0;
  let updatedBoth = 0;
  let skippedOk = 0;
  let skippedUnknownShape = 0;
  let failed = 0;

  for (const e of all) {
    const paidByIsLegacy = e.paidBy === 'partner1' || e.paidBy === 'partner2';
    const currentShares = parsedShares(e);
    const payerId = paidByIsLegacy
      ? (e.paidBy === 'partner1' ? p1.userId : p2.userId)
      : e.paidBy;
    const otherId = payerId === p1.userId ? p2.userId : p1.userId;

    const needsPaidByRewrite = paidByIsLegacy;
    const hasValidSharesForRealUsers = currentShares
      && Object.keys(currentShares).every((k) => memberIds.has(k));
    const needsSharesBuilt = !hasValidSharesForRealUsers;

    if (!needsPaidByRewrite && !needsSharesBuilt) {
      skippedOk += 1;
      continue;
    }

    const splitType = e.splitType || 'equal';
    let newShares: Record<string, number> | null = null;

    if (needsSharesBuilt) {
      if (splitType !== 'equal') {
        skippedUnknownShape += 1;
        console.warn('[backfill] skipping: non-equal split without valid shares', {
          id: e.id, splitType, partner1Share: e.partner1Share, partner2Share: e.partner2Share,
        });
        continue;
      }
      if (!memberIds.has(payerId)) {
        skippedUnknownShape += 1;
        console.warn('[backfill] skipping: cannot resolve payer', { id: e.id, paidBy: e.paidBy });
        continue;
      }
      newShares = equalSplit(e.amount, payerId, otherId);
    }

    const input: Record<string, unknown> = { id: e.id };
    if (needsPaidByRewrite) input.paidBy = payerId;
    if (newShares) input.shares = JSON.stringify(newShares);

    try {
      await client.graphql({ query: mutations.updateExpense, variables: { input } });
      if (needsPaidByRewrite && newShares) updatedBoth += 1;
      else if (needsPaidByRewrite) updatedPaidByOnly += 1;
      else updatedBuiltShares += 1;
    } catch (err) {
      failed += 1;
      console.error('[backfill] update failed', { id: e.id, err });
    }
  }

  const summary = {
    total: all.length,
    updatedPaidByOnly,
    updatedBuiltShares,
    updatedBoth,
    skippedOk,
    skippedUnknownShape,
    failed,
  };
  console.info('[backfill] done', summary);
  console.info('[backfill] refresh the page to recalculate the balance.');
  return summary;
}
