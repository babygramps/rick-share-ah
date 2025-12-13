import type { ExpenseCategory } from '../types';

const merchantCategoryHints: Array<{ category: ExpenseCategory; hints: string[] }> = [
  { category: 'food', hints: ['starbucks', 'mcdonald', 'chipotle', 'taco', 'pizza', 'cafe', 'restaurant', 'doordash', 'ubereats'] },
  { category: 'groceries', hints: ['walmart', 'costco', 'trader joe', 'whole foods', 'aldi', 'safeway', 'kroger', 'grocery'] },
  { category: 'transport', hints: ['uber', 'lyft', 'shell', 'chevron', 'exxon', 'bp', 'gas', 'fuel', 'parking'] },
  { category: 'shopping', hints: ['amazon', 'target', 'best buy', 'ikea', 'shop', 'store'] },
  { category: 'health', hints: ['cvs', 'walgreens', 'pharmacy', 'clinic', 'hospital'] },
  { category: 'utilities', hints: ['comcast', 'verizon', 'att', 'utility', 'electric', 'water', 'internet'] },
  { category: 'entertainment', hints: ['netflix', 'spotify', 'cinema', 'movie', 'theater'] },
  { category: 'travel', hints: ['airbnb', 'hilton', 'marriott', 'delta', 'united', 'southwest', 'hotel', 'airlines'] },
];

export function suggestCategoryFromMerchant(merchantName?: string | null): ExpenseCategory | null {
  if (!merchantName) return null;
  const norm = merchantName.toLowerCase();

  for (const entry of merchantCategoryHints) {
    if (entry.hints.some((h) => norm.includes(h))) return entry.category;
  }
  return null;
}



