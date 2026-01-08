import { useState } from 'react';
import {
  IconPalette,
  IconNotebook,
  IconPlant,
  IconBook,
  IconSparkles,
  IconCheck,
} from '@tabler/icons-react';
import { Card } from './ui/card';
import { useTheme } from '../contexts/ThemeContext';
import { THEMES, type ThemeName } from '../lib/theme-config';
import { cn } from '../lib/utils';

const ICON_MAP = {
  IconPalette,
  IconNotebook,
  IconPlant,
  IconBook,
  IconSparkles,
};

export function ThemeSelector() {
  const { themeName, setThemeName, effectiveMode } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const handleMouseEnter = (theme: ThemeName) => {
    if (isTouchDevice) return;
    setPreviewTheme(theme);

    const root = document.documentElement;
    if (theme === 'default') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setPreviewTheme(null);

    const root = document.documentElement;
    if (themeName === 'default') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = themeName;
    }
  };

  const handleClick = (theme: ThemeName) => {
    setPreviewTheme(null);
    setThemeName(theme);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {THEMES.map((theme) => {
        const Icon = ICON_MAP[theme.icon as keyof typeof ICON_MAP];
        const isActive = themeName === theme.name;
        const isPreviewing = previewTheme === theme.name;
        const swatches = theme.swatches[effectiveMode];

        return (
          <Card
            key={theme.name}
            className={cn(
              'p-4 cursor-pointer transition-all duration-200',
              'hover:scale-[1.02] hover:shadow-md',
              'border-2',
              isActive
                ? 'border-primary bg-accent/20'
                : 'border-border hover:border-accent',
              isPreviewing && 'scale-[1.02] shadow-md'
            )}
            onMouseEnter={() => handleMouseEnter(theme.name as ThemeName)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(theme.name as ThemeName)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-medium text-foreground">
                    {theme.label}
                  </h3>
                  {isActive && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <IconCheck className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {theme.description}
                </p>

                <div className="flex items-center gap-2">
                  {swatches.map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: color }}
                      title={`Color ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
