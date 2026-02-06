/**
 * Skribbl Lobby Settings Component
 *
 * Settings panel for Skribbl game in the lobby.
 */

import { Label } from '@/components/ui/label';
import type { SkribblSettings } from '../types/skribbl.types';
import type { LobbySettingsProps } from '../../../core/registry/game-registry';

const DRAW_TIME_OPTIONS = [30, 60, 90, 120, 150, 180];
const ROUNDS_OPTIONS = [2, 3, 4, 5, 6, 8, 10];
const WORD_COUNT_OPTIONS = [2, 3, 4, 5];

export function SkribblLobbySettings({
  settings: rawSettings,
  onChange,
  disabled,
}: LobbySettingsProps) {
  // Cast to SkribblSettings for type-safe access
  const settings = rawSettings as SkribblSettings;

  const handleChange = <K extends keyof SkribblSettings>(
    key: K,
    value: SkribblSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Draw Time */}
      <div className="space-y-2">
        <Label htmlFor="drawTime">Draw Time</Label>
        <select
          id="drawTime"
          value={settings.drawTime}
          onChange={(e) => handleChange('drawTime', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full rounded-md border bg-background px-3 py-2"
        >
          {DRAW_TIME_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {time} seconds
            </option>
          ))}
        </select>
      </div>

      {/* Rounds */}
      <div className="space-y-2">
        <Label htmlFor="rounds">Rounds</Label>
        <select
          id="rounds"
          value={settings.rounds}
          onChange={(e) => handleChange('rounds', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full rounded-md border bg-background px-3 py-2"
        >
          {ROUNDS_OPTIONS.map((round) => (
            <option key={round} value={round}>
              {round} rounds
            </option>
          ))}
        </select>
      </div>

      {/* Word Count */}
      <div className="space-y-2">
        <Label htmlFor="wordCount">Word Choices</Label>
        <select
          id="wordCount"
          value={settings.wordCount}
          onChange={(e) => handleChange('wordCount', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full rounded-md border bg-background px-3 py-2"
        >
          {WORD_COUNT_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count} words
            </option>
          ))}
        </select>
      </div>

      {/* Hints */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hintsEnabled"
          checked={settings.hintsEnabled}
          onChange={(e) => handleChange('hintsEnabled', e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border"
        />
        <Label htmlFor="hintsEnabled">Enable hints</Label>
      </div>

      {/* Custom Words */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="customWordsOnly"
          checked={settings.customWordsOnly}
          onChange={(e) => handleChange('customWordsOnly', e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border"
        />
        <Label htmlFor="customWordsOnly">Use custom words only</Label>
      </div>

      {/* Custom Words Input */}
      {(settings.customWordsOnly || settings.customWords.length > 0) && (
        <div className="space-y-2">
          <Label htmlFor="customWords">Custom Words (one per line)</Label>
          <textarea
            id="customWords"
            value={settings.customWords.join('\n')}
            onChange={(e) =>
              handleChange(
                'customWords',
                e.target.value.split('\n').filter((w) => w.trim())
              )
            }
            disabled={disabled}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Enter custom words..."
          />
          <p className="text-xs text-muted-foreground">
            {settings.customWords.length} custom words
          </p>
        </div>
      )}
    </div>
  );
}
