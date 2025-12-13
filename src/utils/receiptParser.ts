import { parseCurrencyInput } from './helpers';

// Frontend-side fallback parsing if backend returns partial fields
export function moneyTextToCents(text?: string | null): number | null {
  if (!text) return null;
  const cleaned = String(text).replace(/[^\d.,-]/g, '').replace(/,/g, '');
  // If it already looks like dollars, helpers will convert to cents properly
  const cents = parseCurrencyInput(cleaned);
  return cents > 0 ? cents : null;
}

export function normalizeDateToISO(dateText?: string | null): string | null {
  if (!dateText) return null;
  // If already ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;

  const d = new Date(dateText);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}



