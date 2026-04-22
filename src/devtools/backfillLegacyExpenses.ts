// One-off backfill: rewrites legacy CSV-imported expenses into the new shares shape.
// Run once via the browser console: await __backfillLegacyExpenses()
// Delete this file and its wiring in main.tsx once done.

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
  shares?: string | null;
};

type Member = { userId: string; name?: string };

function hasShares(e: LegacyExpense): boolean {
  if (!e.shares) return false;
  try {
    let parsed: unknown = JSON.parse(e.shares);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return !!parsed && typeof parsed === 'object' && Object.keys(parsed as object).length > 0;
  } catch {
    return false;
  }
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

  let updated = 0;
  let skippedAlreadyNew = 0;
  let skippedUnknownShape = 0;
  let failed = 0;

  for (const e of all) {
    if (hasShares(e)) {
      skippedAlreadyNew += 1;
      continue;
    }
    const isLegacyPaidBy = e.paidBy === 'partner1' || e.paidBy === 'partner2';
    const splitType = e.splitType || 'equal';
    if (!isLegacyPaidBy || splitType !== 'equal') {
      skippedUnknownShape += 1;
      console.warn('[backfill] skipping unrecognized legacy row', { id: e.id, paidBy: e.paidBy, splitType });
      continue;
    }

    const payerId = e.paidBy === 'partner1' ? p1.userId : p2.userId;
    const otherId = e.paidBy === 'partner1' ? p2.userId : p1.userId;
    const half = Math.floor(e.amount / 2);
    const remainder = e.amount - half * 2;
    const shares = {
      [payerId]: half + remainder,
      [otherId]: half,
    };

    try {
      await client.graphql({
        query: mutations.updateExpense,
        variables: {
          input: {
            id: e.id,
            paidBy: payerId,
            shares: JSON.stringify(shares),
          },
        },
      });
      updated += 1;
    } catch (err) {
      failed += 1;
      console.error('[backfill] update failed', { id: e.id, err });
    }
  }

  const summary = { total: all.length, updated, skippedAlreadyNew, skippedUnknownShape, failed };
  console.info('[backfill] done', summary);
  console.info('[backfill] refresh the page to recalculate the balance.');
  return summary;
}
