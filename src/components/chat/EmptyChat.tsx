interface EmptyChatProps {
  onPick: (text: string) => void;
}

const PROMPTS = [
  'How much did we spend on food this month?',
  "Who's ahead on transport?",
  'What was our biggest expense?',
];

export function EmptyChat({ onPick }: EmptyChatProps) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="text-5xl">💬</div>
      <h2 className="font-bold text-lg">Ask anything about your spending</h2>
      <p className="font-mono text-sm text-[var(--color-plum)]/60">
        I read your group's expenses and settlements and answer in plain English.
      </p>
      <div className="flex flex-col gap-2 max-w-md mx-auto pt-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="text-left p-3 bg-white border-2 border-[var(--color-plum)] font-mono text-sm hover:bg-[var(--color-sunshine)] transition-colors"
            style={{ boxShadow: '3px 3px 0 var(--color-plum)' }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
