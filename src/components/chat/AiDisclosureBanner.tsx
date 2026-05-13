import { useState } from 'react';

const STORAGE_KEY = 'rs.aiChatBannerDismissed.v1';

export function AiDisclosureBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div
      className="border-2 border-[var(--color-plum)] bg-[var(--color-lavender)]/40 p-3 font-mono text-xs"
      style={{ boxShadow: '3px 3px 0 var(--color-plum)' }}
    >
      <p className="mb-2">
        Heads up: your messages and your group's expense data are sent to Google's
        Gemini API to generate answers. Per Google's API terms, the data is not used
        to train their models.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="underline uppercase tracking-wider"
      >
        Got it — don't show again
      </button>
    </div>
  );
}
