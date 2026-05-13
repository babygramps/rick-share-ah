import json
from pathlib import Path

def unwrap(v):
    if v is None: return None
    if isinstance(v, dict):
        for k in ('S','N','BOOL'):
            if k in v:
                val = v[k]
                if k == 'N':
                    try: return int(val)
                    except: return float(val)
                if k == 'BOOL': return bool(val)
                return val
        if 'NULL' in v: return None
        if 'M' in v: return {kk: unwrap(vv) for kk,vv in v['M'].items()}
        if 'L' in v: return [unwrap(x) for x in v['L']]
    return v

def row(i): return {k: unwrap(v) for k,v in i.items()}

expenses = [row(i) for i in json.loads(Path('expenses-full.json').read_text())['Items']]
settlements = [row(i) for i in json.loads(Path('settlements-full.json').read_text())['Items']]
members = [row(i) for i in json.loads(Path('members-full.json').read_text())['Items']]

GID = 'b33ece50-8daf-4a11-9d6f-9c9ed601803e'
expenses = [e for e in expenses if e.get('groupId') == GID]
settlements = [s for s in settlements if s.get('groupId') == GID]
members = [m for m in members if m.get('groupId') == GID]

name_by = {m['userId']: m['name'] for m in members}
members_sorted = sorted(members, key=lambda m: m.get('createdAt',''))
p1_id = members_sorted[0]['userId']
p2_id = members_sorted[1]['userId']
print(f'partner1 -> {name_by[p1_id]} ({p1_id[:8]}...)')
print(f'partner2 -> {name_by[p2_id]} ({p2_id[:8]}...)')
print(f'members: {list(name_by.values())}')
print(f'{len(expenses)} expenses, {len(settlements)} settlements\n')

def get_shares(e):
    """Return shares as dict[userId -> cents], or None if missing/invalid. Handles both DDB Map and JSON-string storage."""
    s = e.get('shares')
    if s is None: return None
    if isinstance(s, dict):
        if len(s) == 0: return None
        return {k: int(v) for k,v in s.items()}
    if isinstance(s, str):
        if not s.strip(): return None
        try:
            x = json.loads(s)
            if isinstance(x, str): x = json.loads(x)
            if isinstance(x, dict) and len(x) > 0:
                return {k: int(v) for k,v in x.items()}
        except: pass
    return None

def compute(expenses, skip_legacy):
    bal = {m['userId']: 0 for m in members}
    counted_new = counted_legacy = 0
    skipped_legacy = weird = 0
    for e in expenses:
        shares = get_shares(e)
        amt = int(e.get('amount') or 0)
        paid_by = e.get('paidBy')
        p1s = e.get('partner1Share'); p2s = e.get('partner2Share')
        if shares is not None:
            # App's path when shares present - works regardless of paidBy shape
            # For partner1/2 in paidBy, app would write to bal['partner1'] which is a string key, effectively ignored
            if paid_by in ('partner1','partner2'):
                # Simulate app behavior: credit goes to a non-existent key, shares still debit real users
                if not skip_legacy:
                    real_payer = p1_id if paid_by == 'partner1' else p2_id
                    bal[real_payer] = bal.get(real_payer, 0) + amt
                    for uid, sh in shares.items():
                        bal[uid] = bal.get(uid, 0) - sh
                    counted_legacy += 1
                else:
                    # App writes to bal['partner1'] (bogus) and subtracts shares
                    bal[paid_by] = bal.get(paid_by, 0) + amt
                    for uid, sh in shares.items():
                        bal[uid] = bal.get(uid, 0) - sh
                    counted_legacy += 1
            else:
                bal[paid_by] = bal.get(paid_by, 0) + amt
                for uid, sh in shares.items():
                    bal[uid] = bal.get(uid, 0) - sh
                counted_new += 1
            continue
        # No shares present. App skips only if partner1Share or partner2Share defined.
        if p1s is not None or p2s is not None:
            if skip_legacy:
                skipped_legacy += 1
                continue
            # Backfill path
            if paid_by in ('partner1','partner2'):
                payer = p1_id if paid_by == 'partner1' else p2_id
                other = p2_id if paid_by == 'partner1' else p1_id
                half = amt // 2
                rem = amt - 2*half
                bal[payer] = bal.get(payer, 0) + amt - (half + rem)
                bal[other] = bal.get(other, 0) - half
                counted_legacy += 1
            else:
                weird += 1
        else:
            # Empty shares, no partner fields - app processes: credit payer, no debits
            bal[paid_by] = bal.get(paid_by, 0) + amt
            weird += 1
    for s in settlements:
        amt = int(s.get('amount') or 0)
        bal[s['paidBy']] = bal.get(s['paidBy'], 0) + amt
        bal[s['paidTo']] = bal.get(s['paidTo'], 0) - amt
    return bal, counted_new, counted_legacy, skipped_legacy, weird

def print_summary(label, bal, cn, cl, sl, w):
    print(f'=== {label} ===')
    print(f'  new-shape counted: {cn}, legacy counted: {cl}, legacy skipped: {sl}, weird: {w}')
    real_bals = {uid: bal.get(uid,0) for uid in (p1_id, p2_id)}
    for uid, c in real_bals.items():
        print(f'    {name_by[uid]}: {c/100:+.2f}')
    # bogus buckets (should be zero for post-backfill)
    bogus = {k:v for k,v in bal.items() if k not in (p1_id, p2_id) and v != 0}
    if bogus:
        print(f'    !! bogus buckets: {[(k, v/100) for k,v in bogus.items()]}')
    p1 = real_bals[p1_id]; p2 = real_bals[p2_id]
    if p1 > 0 and p2 < 0:
        print(f'  => {name_by[p2_id]} owes {name_by[p1_id]} ${abs(p1)/100:.2f}')
    elif p2 > 0 and p1 < 0:
        print(f'  => {name_by[p1_id]} owes {name_by[p2_id]} ${abs(p2)/100:.2f}')
    else:
        print(f'  => balance unclear (both positive or both negative)')
    print()

bal, cn, cl, sl, w = compute(expenses, skip_legacy=True)
print_summary('CURRENT (as app computes, legacy rows skipped, bogus-key credits happen)', bal, cn, cl, sl, w)

bal, cn, cl, sl, w = compute(expenses, skip_legacy=False)
print_summary('AFTER BACKFILL (legacy rows rewritten correctly)', bal, cn, cl, sl, w)

# Totals
tot_exp = sum(int(e.get('amount') or 0) for e in expenses)
tot_set = sum(int(s.get('amount') or 0) for s in settlements)
print(f'total expense volume: ${tot_exp/100:,.2f}')
print(f'total settlement volume: ${tot_set/100:,.2f}')
