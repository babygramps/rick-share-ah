import { useTheme } from '../../context/ThemeContext';
import type { ThemeDefinition } from '../../themes';

function ThemeCard({ 
  theme, 
  isActive, 
  onClick 
}: { 
  theme: ThemeDefinition; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left p-3 border-3 transition-all duration-200
        ${isActive 
          ? 'border-[var(--color-plum)] shadow-[4px_4px_0px_var(--color-plum)] -translate-x-0.5 -translate-y-0.5' 
          : 'border-[var(--color-plum)]/30 hover:border-[var(--color-plum)]/60 hover:shadow-[2px_2px_0px_var(--color-plum)]/30'
        }
        bg-white
      `}
      style={{ borderWidth: '3px' }}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-[var(--color-coral)] border-2 border-[var(--color-plum)] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Color preview swatches */}
      <div className="flex gap-1 mb-2">
        <div 
          className="w-8 h-8 border-2 border-[var(--color-plum)]/20"
          style={{ backgroundColor: theme.preview.primary }}
          title="Primary"
        />
        <div 
          className="w-8 h-8 border-2 border-[var(--color-plum)]/20"
          style={{ backgroundColor: theme.preview.secondary }}
          title="Secondary"
        />
        <div 
          className="w-8 h-8 border-2 border-[var(--color-plum)]/20"
          style={{ backgroundColor: theme.preview.accent }}
          title="Accent"
        />
        <div 
          className="w-8 h-8 border-2 border-[var(--color-plum)]/20"
          style={{ backgroundColor: theme.preview.background }}
          title="Background"
        />
      </div>

      {/* Theme name */}
      <p className="font-bold text-sm text-[var(--color-plum)] mb-0.5">
        {theme.name}
      </p>

      {/* Theme description */}
      <p className="font-mono text-xs text-[var(--color-plum)]/60 leading-tight">
        {theme.description}
      </p>
    </button>
  );
}

export function ThemeSelector() {
  const { theme: currentTheme, setTheme, themes } = useTheme();

  return (
    <div className="space-y-4">
      <p className="font-mono text-xs text-[var(--color-plum)]/60">
        Choose a style inspired by 2025/2026 interior design trends
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={currentTheme === theme.id}
            onClick={() => setTheme(theme.id)}
          />
        ))}
      </div>
    </div>
  );
}
