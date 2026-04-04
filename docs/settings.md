# Settings

> Last updated: 2026-04-04

## Overview

The Settings page lets authenticated users view their profile information, change their password, and customize the application's appearance. The appearance system supports three color modes (light, dark, system) and multiple named themes, each with its own color palette and optional custom fonts. All preferences are persisted to localStorage via `storage.service.ts`.

## How It Works

### Theme System

The theme system is built on two orthogonal axes:

1. **Color mode** (`light` | `dark` | `system`): Controls which class (`light` or `dark`) is applied to the document root element. When set to `system`, a `matchMedia` listener reacts to OS-level preference changes in real time.

2. **Theme name** (e.g., `default`, `notebook`, `pale-garden`, `vintage-paper`, `pastel-dreams`): Controls which design token set is applied via a `data-theme` attribute on the root element. Each theme defines color swatches for both light and dark modes, optional Google Fonts, and descriptive metadata.

The `ThemeProvider` context manages both values and exposes them via the `useTheme()` hook. On every change:

- The root element's class list is updated (`light`/`dark`).
- The `data-theme` attribute is set (or removed for the `default` theme).
- Both values are saved to localStorage via `storage.service.ts` (`mode` and `themeName` keys).

#### Available Themes

| Name | Label | Fonts | Description |
|------|-------|-------|-------------|
| `default` | Default | System fonts | Clean neutral theme with modern aesthetic |
| `notebook` | Notebook | Architects Daughter | Handwritten, casual aesthetic |
| `pale-garden` | Pale Garden | Antic, Signifier, JetBrains Mono | Muted natural colors with sage greens |
| `vintage-paper` | Vintage Paper | Libre Baskerville, Lora, IBM Plex Mono | Warm paper-like aesthetic with serif fonts |
| `pastel-dreams` | Pastel Dreams | Open Sans, Source Serif 4, IBM Plex Mono | Soft pastel colors with dreamy aesthetics |

#### Font Loading

Theme-specific fonts are loaded lazily from Google Fonts when a theme is selected. The `ThemeProvider` creates `<link>` elements in `<head>` with de-duplication (checked by link `id`). Fonts persist across theme switches since the link elements are not removed.

#### Legacy Migration

On first load, the `ThemeProvider` checks for a legacy `theme` key in localStorage (from an older implementation) and migrates it to the current `mode` key before deleting the old entry.

### Password Change

The `ChangePasswordModal` provides a form with three fields: current password, new password, and confirm password. Each field has a show/hide toggle.

**Client-side validation**:
- New password must be at least 6 characters.
- New password must match the confirmation.
- New password must differ from the current password.

**Server-side flow**:
1. `PUT /api/auth/password` (rate limited, requires authentication).
2. Backend verifies the current password against the stored bcrypt hash.
3. Backend checks the new password is not identical to the current one.
4. The password hash is updated and all refresh tokens for the user are deleted.
5. On success, the frontend shows a confirmation message, waits 1.5 seconds, then calls `logout()` and redirects to `/login`. This forces re-authentication with the new password across all devices.

### Profile Information

The Settings page displays read-only profile data from the Redux auth state: name, email, role (admin/member), user ID, member since date, and last updated date. An avatar with generated initials is shown.

### storage.service Integration

The `storage.service.ts` module provides the following theme-related functions:

- `getThemeMode()` / `setThemeMode(mode)` -- Read/write the `mode` localStorage key
- `getThemeName()` / `setThemeName(name)` -- Read/write the `themeName` localStorage key
- `migrateLegacyTheme()` -- One-time migration from the old `theme` key

All functions are wrapped in try-catch to gracefully handle private browsing or full storage.

## Architecture

```
Frontend
--------
pages/Settings.tsx
  +-- ModeToggle (light/dark/system buttons)
  +-- ThemeSelector component
  +-- ChangePasswordModal

contexts/ThemeContext.tsx
  +-- ThemeProvider (manages mode + themeName)
  +-- useTheme() hook

lib/theme-config.ts
  +-- THEMES array (name, label, fonts, swatches)
  +-- ThemeName type

lib/storage.service.ts
  +-- getThemeMode / setThemeMode
  +-- getThemeName / setThemeName
  +-- migrateLegacyTheme

components/auth/ChangePasswordModal.tsx
  +-- Client-side validation
  +-- useChangePassword mutation
  +-- useLogout + redirect on success
```

## API Endpoints

| Method | Path | Auth Required | Description |
|--------|------|:-------------:|-------------|
| `PUT` | `/api/auth/password` | Yes | Change password (rate limited). Revokes all sessions on success. |

## iOS Considerations

- All localStorage operations are wrapped in try-catch to handle iOS Safari private browsing mode, where `localStorage.setItem` throws a `QuotaExceededError`.
- Theme preferences fall back to defaults (`system` mode, `default` theme) when storage is unavailable.

## Extensibility

- **Adding a new theme**: Add an entry to the `THEMES` array in `lib/theme-config.ts` with a unique `name`, CSS color swatches for both light and dark modes, and optional font families. The `ThemeName` type is derived automatically from the array. Then define the corresponding CSS custom properties under `[data-theme="your-theme-name"]` in the stylesheet.
- **Additional settings**: The Settings page uses a card-based layout. New sections (e.g., notification preferences, language) can be added as additional `Card` components without modifying existing ones.
- **Profile editing**: Currently read-only. Adding edit capability would involve new API endpoints and form states within the existing profile card.

## Key Files

- `/frontend/src/pages/Settings.tsx` -- Settings page with profile, security, and appearance sections
- `/frontend/src/contexts/ThemeContext.tsx` -- Theme provider and `useTheme` hook
- `/frontend/src/lib/theme-config.ts` -- Theme definitions (names, fonts, color swatches)
- `/frontend/src/lib/storage.service.ts` -- localStorage wrapper for theme and auth persistence
- `/frontend/src/components/auth/ChangePasswordModal.tsx` -- Password change dialog with validation
