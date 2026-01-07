# Common for all themes
```css
:root {
    ...
    /* Status Colors */
    --success: oklch(0.65 0.18 145);
    --success-foreground: oklch(1.0 0 0);
    --warning: oklch(0.75 0.15 85);
    --warning-foreground: oklch(0.25 0.05 85);
    --info: oklch(0.60 0.15 250);
    --info-foreground: oklch(1.0 0 0);
    ...
}

.dark {
    ...
    /* Status Colors */
    --success: oklch(0.65 0.18 145);
    --success-foreground: oklch(0.15 0.05 145);
    --warning: oklch(0.75 0.15 85);
    --warning-foreground: oklch(0.20 0.05 85);
    --info: oklch(0.65 0.15 250);
    --info-foreground: oklch(0.15 0.02 250);
    ...
}

@theme inline {
    ...
    /* Status Colors */
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
    ...
}
```

# Default theme css
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.1450 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1450 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.1450 0 0);
  --primary: oklch(0.2050 0 0);
  --primary-foreground: oklch(0.9850 0 0);
  --secondary: oklch(0.9700 0 0);
  --secondary-foreground: oklch(0.2050 0 0);
  --muted: oklch(0.9700 0 0);
  --muted-foreground: oklch(0.5560 0 0);
  --accent: oklch(0.9700 0 0);
  --accent-foreground: oklch(0.2050 0 0);
  --destructive: oklch(0.5770 0.2450 27.3250);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9220 0 0);
  --input: oklch(0.9220 0 0);
  --ring: oklch(0.7080 0 0);
  --chart-1: oklch(0.8100 0.1000 252);
  --chart-2: oklch(0.6200 0.1900 260);
  --chart-3: oklch(0.5500 0.2200 263);
  --chart-4: oklch(0.4900 0.2200 264);
  --chart-5: oklch(0.4200 0.1800 266);
  --sidebar: oklch(0.9850 0 0);
  --sidebar-foreground: oklch(0.1450 0 0);
  --sidebar-primary: oklch(0.2050 0 0);
  --sidebar-primary-foreground: oklch(0.9850 0 0);
  --sidebar-accent: oklch(0.9700 0 0);
  --sidebar-accent-foreground: oklch(0.2050 0 0);
  --sidebar-border: oklch(0.9220 0 0);
  --sidebar-ring: oklch(0.7080 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.625rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.1450 0 0);
  --foreground: oklch(0.9850 0 0);
  --card: oklch(0.2050 0 0);
  --card-foreground: oklch(0.9850 0 0);
  --popover: oklch(0.2690 0 0);
  --popover-foreground: oklch(0.9850 0 0);
  --primary: oklch(0.9220 0 0);
  --primary-foreground: oklch(0.2050 0 0);
  --secondary: oklch(0.2690 0 0);
  --secondary-foreground: oklch(0.9850 0 0);
  --muted: oklch(0.2690 0 0);
  --muted-foreground: oklch(0.7080 0 0);
  --accent: oklch(0.3710 0 0);
  --accent-foreground: oklch(0.9850 0 0);
  --destructive: oklch(0.7040 0.1910 22.2160);
  --destructive-foreground: oklch(0.9850 0 0);
  --border: oklch(0.2750 0 0);
  --input: oklch(0.3250 0 0);
  --ring: oklch(0.5560 0 0);
  --chart-1: oklch(0.8100 0.1000 252);
  --chart-2: oklch(0.6200 0.1900 260);
  --chart-3: oklch(0.5500 0.2200 263);
  --chart-4: oklch(0.4900 0.2200 264);
  --chart-5: oklch(0.4200 0.1800 266);
  --sidebar: oklch(0.2050 0 0);
  --sidebar-foreground: oklch(0.9850 0 0);
  --sidebar-primary: oklch(0.4880 0.2430 264.3760);
  --sidebar-primary-foreground: oklch(0.9850 0 0);
  --sidebar-accent: oklch(0.2690 0 0);
  --sidebar-accent-foreground: oklch(0.9850 0 0);
  --sidebar-border: oklch(0.2750 0 0);
  --sidebar-ring: oklch(0.4390 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.625rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

# Notebook theme css
```css
:root {
  --background: oklch(0.9821 0 0);
  --foreground: oklch(0.3485 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.3485 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.3485 0 0);
  --primary: oklch(0.4891 0 0);
  --primary-foreground: oklch(0.9551 0 0);
  --secondary: oklch(0.9006 0 0);
  --secondary-foreground: oklch(0.3485 0 0);
  --muted: oklch(0.9158 0 0);
  --muted-foreground: oklch(0.4313 0 0);
  --accent: oklch(0.9354 0.0456 94.8549);
  --accent-foreground: oklch(0.4015 0.0436 37.9587);
  --destructive: oklch(0.6627 0.0978 20.0041);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.5538 0.0025 17.2320);
  --input: oklch(1.0000 0 0);
  --ring: oklch(0.7058 0 0);
  --chart-1: oklch(0.3211 0 0);
  --chart-2: oklch(0.4495 0 0);
  --chart-3: oklch(0.5693 0 0);
  --chart-4: oklch(0.6830 0 0);
  --chart-5: oklch(0.7921 0 0);
  --sidebar: oklch(0.9551 0 0);
  --sidebar-foreground: oklch(0.3485 0 0);
  --sidebar-primary: oklch(0.4891 0 0);
  --sidebar-primary-foreground: oklch(0.9551 0 0);
  --sidebar-accent: oklch(0.9354 0.0456 94.8549);
  --sidebar-accent-foreground: oklch(0.4015 0.0436 37.9587);
  --sidebar-border: oklch(0.8078 0 0);
  --sidebar-ring: oklch(0.7058 0 0);
  --font-sans: Architects Daughter, sans-serif;
  --font-serif: "Times New Roman", Times, serif;
  --font-mono: "Courier New", Courier, monospace;
  --radius: 0.625rem;
  --shadow-x: 1px;
  --shadow-y: 4px;
  --shadow-blur: 5px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.03;
  --shadow-color: #000000;
  --shadow-2xs: 1px 4px 5px 0px hsl(0 0% 0% / 0.01);
  --shadow-xs: 1px 4px 5px 0px hsl(0 0% 0% / 0.01);
  --shadow-sm: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 1px 2px -1px hsl(0 0% 0% / 0.03);
  --shadow: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 1px 2px -1px hsl(0 0% 0% / 0.03);
  --shadow-md: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 2px 4px -1px hsl(0 0% 0% / 0.03);
  --shadow-lg: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 4px 6px -1px hsl(0 0% 0% / 0.03);
  --shadow-xl: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 8px 10px -1px hsl(0 0% 0% / 0.03);
  --shadow-2xl: 1px 4px 5px 0px hsl(0 0% 0% / 0.07);
  --tracking-normal: 0.5px;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2891 0 0);
  --foreground: oklch(0.8945 0 0);
  --card: oklch(0.3211 0 0);
  --card-foreground: oklch(0.8945 0 0);
  --popover: oklch(0.3211 0 0);
  --popover-foreground: oklch(0.8945 0 0);
  --primary: oklch(0.7572 0 0);
  --primary-foreground: oklch(0.2891 0 0);
  --secondary: oklch(0.4676 0 0);
  --secondary-foreground: oklch(0.8078 0 0);
  --muted: oklch(0.3904 0 0);
  --muted-foreground: oklch(0.7058 0 0);
  --accent: oklch(0.9067 0 0);
  --accent-foreground: oklch(0.3211 0 0);
  --destructive: oklch(0.7915 0.0491 18.2410);
  --destructive-foreground: oklch(0.2891 0 0);
  --border: oklch(0.4276 0 0);
  --input: oklch(0.3211 0 0);
  --ring: oklch(0.8078 0 0);
  --chart-1: oklch(0.9521 0 0);
  --chart-2: oklch(0.8576 0 0);
  --chart-3: oklch(0.7572 0 0);
  --chart-4: oklch(0.6534 0 0);
  --chart-5: oklch(0.5452 0 0);
  --sidebar: oklch(0.2478 0 0);
  --sidebar-foreground: oklch(0.8945 0 0);
  --sidebar-primary: oklch(0.7572 0 0);
  --sidebar-primary-foreground: oklch(0.2478 0 0);
  --sidebar-accent: oklch(0.9067 0 0);
  --sidebar-accent-foreground: oklch(0.3211 0 0);
  --sidebar-border: oklch(0.4276 0 0);
  --sidebar-ring: oklch(0.8078 0 0);
  --font-sans: Architects Daughter, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: "Fira Code", "Courier New", monospace;
  --radius: 0.625rem;
  --shadow-x: 1px;
  --shadow-y: 4px;
  --shadow-blur: 5px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.03;
  --shadow-color: #000000;
  --shadow-2xs: 1px 4px 5px 0px hsl(0 0% 0% / 0.01);
  --shadow-xs: 1px 4px 5px 0px hsl(0 0% 0% / 0.01);
  --shadow-sm: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 1px 2px -1px hsl(0 0% 0% / 0.03);
  --shadow: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 1px 2px -1px hsl(0 0% 0% / 0.03);
  --shadow-md: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 2px 4px -1px hsl(0 0% 0% / 0.03);
  --shadow-lg: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 4px 6px -1px hsl(0 0% 0% / 0.03);
  --shadow-xl: 1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 8px 10px -1px hsl(0 0% 0% / 0.03);
  --shadow-2xl: 1px 4px 5px 0px hsl(0 0% 0% / 0.07);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);

  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-normal: var(--tracking-normal);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);
}

body {
  letter-spacing: var(--tracking-normal);
}
```

# Pale Garden theme css
```css
:root {
  --background: oklch(0.9761 0.0041 91.4461);
  --foreground: oklch(0.2417 0.0298 269.8827);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.2417 0.0298 269.8827);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2417 0.0298 269.8827);
  --primary: oklch(0.6333 0.0309 154.9039);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.8596 0.0291 119.9919);
  --secondary-foreground: oklch(0.2417 0.0298 269.8827);
  --muted: oklch(0.9251 0.0071 88.6450);
  --muted-foreground: oklch(0.5510 0.0234 264.3637);
  --accent: oklch(0.8242 0.0221 136.6092);
  --accent-foreground: oklch(0.2417 0.0298 269.8827);
  --destructive: oklch(0.5624 0.1743 26.1433);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9251 0.0071 88.6450);
  --input: oklch(1.0000 0 0);
  --ring: oklch(0.6333 0.0309 154.9039);
  --chart-1: oklch(0.6333 0.0309 154.9039);
  --chart-2: oklch(0.7209 0.0489 120.9474);
  --chart-3: oklch(0.6744 0.0427 136.0110);
  --chart-4: oklch(0.5510 0.0234 264.3637);
  --chart-5: oklch(0.9251 0.0071 88.6450);
  --sidebar: oklch(0.9845 0.0026 106.4477);
  --sidebar-foreground: oklch(0.2417 0.0298 269.8827);
  --sidebar-primary: oklch(0.6333 0.0309 154.9039);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9251 0.0071 88.6450);
  --sidebar-accent-foreground: oklch(0.2417 0.0298 269.8827);
  --sidebar-border: oklch(0.9251 0.0071 88.6450);
  --sidebar-ring: oklch(0.6333 0.0309 154.9039);
  --font-sans: Antic, ui-sans-serif, sans-serif, system-ui;
  --font-serif: Signifier, Georgia, serif;
  --font-mono: JetBrains Mono, Courier New, monospace;
  --radius: 0.35rem;
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 2px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.04;
  --shadow-color: #1a1f2e;
  --shadow-2xs: 0px 1px 2px 0px hsl(225 27.7778% 14.1176% / 0.02);
  --shadow-xs: 0px 1px 2px 0px hsl(225 27.7778% 14.1176% / 0.02);
  --shadow-sm: 0px 1px 2px 0px hsl(225 27.7778% 14.1176% / 0.04), 0px 1px 2px -1px hsl(225 27.7778% 14.1176% / 0.04);
  --shadow: 0px 1px 2px 0px hsl(225 27.7778% 14.1176% / 0.04), 0px 1px 2px -1px hsl(225 27.7778% 14.1176% / 0.04);
  --shadow-md: 0px 1px 2px 0px hsl(225 27.7778% 14.1176% / 0.04), 0px 2px 4px -1px hsl(225 27.7778% 14.1176% / 0.04);
  --shadow-lg: 0px 1px 2px 0px hsl(225 27.7778% 14.1176% / 0.04), 0px 4px 6px -1px hsl(225 27.7778% 14.1176% / 0.04);
  --shadow-xl: 0px 1px 2px 0px hsl(225 27.7778% 14.1176% / 0.04), 0px 8px 10px -1px hsl(225 27.7778% 14.1176% / 0.04);
  --shadow-2xl: 0px 1px 2px 0px hsl(225 27.7778% 14.1176% / 0.10);
  --tracking-normal: 0em;
  --spacing: 0.23rem;
}

.dark {
  --background: oklch(0.1448 0 0);
  --foreground: oklch(0.9702 0 0);
  --card: oklch(0.1822 0 0);
  --card-foreground: oklch(0.9702 0 0);
  --popover: oklch(0.1822 0 0);
  --popover-foreground: oklch(0.9702 0 0);
  --primary: oklch(0.6333 0.0309 154.9039);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.2178 0 0);
  --secondary-foreground: oklch(0.9702 0 0);
  --muted: oklch(0.2178 0 0);
  --muted-foreground: oklch(0.7058 0 0);
  --accent: oklch(0.3709 0.0248 153.9823);
  --accent-foreground: oklch(0.9702 0 0);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.2850 0 0);
  --input: oklch(0.1822 0 0);
  --ring: oklch(0.6333 0.0309 154.9039);
  --chart-1: oklch(0.6333 0.0309 154.9039);
  --chart-2: oklch(0.7209 0.0489 120.9474);
  --chart-3: oklch(0.6744 0.0427 136.0110);
  --chart-4: oklch(0.5510 0.0234 264.3637);
  --chart-5: oklch(0.5096 0.0289 152.3460);
  --sidebar: oklch(0.1684 0 0);
  --sidebar-foreground: oklch(0.9702 0 0);
  --sidebar-primary: oklch(0.6333 0.0309 154.9039);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.2178 0 0);
  --sidebar-accent-foreground: oklch(0.9702 0 0);
  --sidebar-border: oklch(0.2850 0 0);
  --sidebar-ring: oklch(0.6333 0.0309 154.9039);
  --font-sans: Antic, ui-sans-serif, sans-serif, system-ui;
  --font-serif: Signifier, Georgia, serif;
  --font-mono: JetBrains Mono, Courier New, monospace;
  --radius: 0.35rem;
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 2px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.04;
  --shadow-color: #000000;
  --shadow-2xs: 0px 1px 2px 0px hsl(0 0% 0% / 0.02);
  --shadow-xs: 0px 1px 2px 0px hsl(0 0% 0% / 0.02);
  --shadow-sm: 0px 1px 2px 0px hsl(0 0% 0% / 0.04), 0px 1px 2px -1px hsl(0 0% 0% / 0.04);
  --shadow: 0px 1px 2px 0px hsl(0 0% 0% / 0.04), 0px 1px 2px -1px hsl(0 0% 0% / 0.04);
  --shadow-md: 0px 1px 2px 0px hsl(0 0% 0% / 0.04), 0px 2px 4px -1px hsl(0 0% 0% / 0.04);
  --shadow-lg: 0px 1px 2px 0px hsl(0 0% 0% / 0.04), 0px 4px 6px -1px hsl(0 0% 0% / 0.04);
  --shadow-xl: 0px 1px 2px 0px hsl(0 0% 0% / 0.04), 0px 8px 10px -1px hsl(0 0% 0% / 0.04);
  --shadow-2xl: 0px 1px 2px 0px hsl(0 0% 0% / 0.10);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

# Vintage Paper theme css
```css
:root {
  --background: oklch(0.9582 0.0152 90.2357);
  --foreground: oklch(0.3760 0.0225 64.3434);
  --card: oklch(0.9914 0.0098 87.4695);
  --card-foreground: oklch(0.3760 0.0225 64.3434);
  --popover: oklch(0.9914 0.0098 87.4695);
  --popover-foreground: oklch(0.3760 0.0225 64.3434);
  --primary: oklch(0.6180 0.0778 65.5444);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.8846 0.0302 85.5655);
  --secondary-foreground: oklch(0.4313 0.0300 64.9288);
  --muted: oklch(0.9239 0.0190 83.0636);
  --muted-foreground: oklch(0.5391 0.0387 71.1655);
  --accent: oklch(0.8348 0.0426 88.8064);
  --accent-foreground: oklch(0.3760 0.0225 64.3434);
  --destructive: oklch(0.5471 0.1438 32.9149);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.8606 0.0321 84.5881);
  --input: oklch(0.8606 0.0321 84.5881);
  --ring: oklch(0.6180 0.0778 65.5444);
  --chart-1: oklch(0.6180 0.0778 65.5444);
  --chart-2: oklch(0.5604 0.0624 68.5805);
  --chart-3: oklch(0.4851 0.0570 72.6827);
  --chart-4: oklch(0.6777 0.0624 64.7755);
  --chart-5: oklch(0.7264 0.0581 66.6967);
  --sidebar: oklch(0.9239 0.0190 83.0636);
  --sidebar-foreground: oklch(0.3760 0.0225 64.3434);
  --sidebar-primary: oklch(0.6180 0.0778 65.5444);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.8348 0.0426 88.8064);
  --sidebar-accent-foreground: oklch(0.3760 0.0225 64.3434);
  --sidebar-border: oklch(0.8606 0.0321 84.5881);
  --sidebar-ring: oklch(0.6180 0.0778 65.5444);
  --font-sans: Libre Baskerville, serif;
  --font-serif: Lora, serif;
  --font-mono: IBM Plex Mono, monospace;
  --radius: 0.25rem;
  --shadow-x: 2px;
  --shadow-y: 3px;
  --shadow-blur: 5px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.12;
  --shadow-color: hsl(28 13% 20%);
  --shadow-2xs: 2px 3px 5px 0px hsl(28 13% 20% / 0.06);
  --shadow-xs: 2px 3px 5px 0px hsl(28 13% 20% / 0.06);
  --shadow-sm: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 1px 2px -1px hsl(28 13% 20% / 0.12);
  --shadow: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 1px 2px -1px hsl(28 13% 20% / 0.12);
  --shadow-md: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 2px 4px -1px hsl(28 13% 20% / 0.12);
  --shadow-lg: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 4px 6px -1px hsl(28 13% 20% / 0.12);
  --shadow-xl: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 8px 10px -1px hsl(28 13% 20% / 0.12);
  --shadow-2xl: 2px 3px 5px 0px hsl(28 13% 20% / 0.30);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2747 0.0139 57.6523);
  --foreground: oklch(0.9239 0.0190 83.0636);
  --card: oklch(0.3237 0.0155 59.0603);
  --card-foreground: oklch(0.9239 0.0190 83.0636);
  --popover: oklch(0.3237 0.0155 59.0603);
  --popover-foreground: oklch(0.9239 0.0190 83.0636);
  --primary: oklch(0.7264 0.0581 66.6967);
  --primary-foreground: oklch(0.2747 0.0139 57.6523);
  --secondary: oklch(0.3795 0.0181 57.1280);
  --secondary-foreground: oklch(0.9239 0.0190 83.0636);
  --muted: oklch(0.2939 0.0125 62.1298);
  --muted-foreground: oklch(0.7982 0.0243 82.1078);
  --accent: oklch(0.4186 0.0281 56.3404);
  --accent-foreground: oklch(0.9239 0.0190 83.0636);
  --destructive: oklch(0.5471 0.1438 32.9149);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3795 0.0181 57.1280);
  --input: oklch(0.3795 0.0181 57.1280);
  --ring: oklch(0.7264 0.0581 66.6967);
  --chart-1: oklch(0.7264 0.0581 66.6967);
  --chart-2: oklch(0.6777 0.0624 64.7755);
  --chart-3: oklch(0.6180 0.0778 65.5444);
  --chart-4: oklch(0.5604 0.0624 68.5805);
  --chart-5: oklch(0.4851 0.0570 72.6827);
  --sidebar: oklch(0.2747 0.0139 57.6523);
  --sidebar-foreground: oklch(0.9239 0.0190 83.0636);
  --sidebar-primary: oklch(0.7264 0.0581 66.6967);
  --sidebar-primary-foreground: oklch(0.2747 0.0139 57.6523);
  --sidebar-accent: oklch(0.4186 0.0281 56.3404);
  --sidebar-accent-foreground: oklch(0.9239 0.0190 83.0636);
  --sidebar-border: oklch(0.3795 0.0181 57.1280);
  --sidebar-ring: oklch(0.7264 0.0581 66.6967);
  --font-sans: Libre Baskerville, serif;
  --font-serif: Lora, serif;
  --font-mono: IBM Plex Mono, monospace;
  --radius: 0.25rem;
  --shadow-x: 2px;
  --shadow-y: 3px;
  --shadow-blur: 5px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.12;
  --shadow-color: hsl(28 13% 20%);
  --shadow-2xs: 2px 3px 5px 0px hsl(28 13% 20% / 0.06);
  --shadow-xs: 2px 3px 5px 0px hsl(28 13% 20% / 0.06);
  --shadow-sm: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 1px 2px -1px hsl(28 13% 20% / 0.12);
  --shadow: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 1px 2px -1px hsl(28 13% 20% / 0.12);
  --shadow-md: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 2px 4px -1px hsl(28 13% 20% / 0.12);
  --shadow-lg: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 4px 6px -1px hsl(28 13% 20% / 0.12);
  --shadow-xl: 2px 3px 5px 0px hsl(28 13% 20% / 0.12), 2px 8px 10px -1px hsl(28 13% 20% / 0.12);
  --shadow-2xl: 2px 3px 5px 0px hsl(28 13% 20% / 0.30);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

# Pastel Dreams theme css
```css
:root {
  --background: oklch(0.9689 0.0090 314.7819);
  --foreground: oklch(0.3729 0.0306 259.7328);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.3729 0.0306 259.7328);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.3729 0.0306 259.7328);
  --primary: oklch(0.7090 0.1592 293.5412);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9073 0.0530 306.0902);
  --secondary-foreground: oklch(0.4461 0.0263 256.8018);
  --muted: oklch(0.9464 0.0327 307.1745);
  --muted-foreground: oklch(0.5510 0.0234 264.3637);
  --accent: oklch(0.9376 0.0260 321.9388);
  --accent-foreground: oklch(0.3729 0.0306 259.7328);
  --destructive: oklch(0.8077 0.1035 19.5706);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9073 0.0530 306.0902);
  --input: oklch(0.9073 0.0530 306.0902);
  --ring: oklch(0.7090 0.1592 293.5412);
  --chart-1: oklch(0.7090 0.1592 293.5412);
  --chart-2: oklch(0.6056 0.2189 292.7172);
  --chart-3: oklch(0.5413 0.2466 293.0090);
  --chart-4: oklch(0.4907 0.2412 292.5809);
  --chart-5: oklch(0.4320 0.2106 292.7591);
  --sidebar: oklch(0.9073 0.0530 306.0902);
  --sidebar-foreground: oklch(0.3729 0.0306 259.7328);
  --sidebar-primary: oklch(0.7090 0.1592 293.5412);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9376 0.0260 321.9388);
  --sidebar-accent-foreground: oklch(0.3729 0.0306 259.7328);
  --sidebar-border: oklch(0.9073 0.0530 306.0902);
  --sidebar-ring: oklch(0.7090 0.1592 293.5412);
  --font-sans: Open Sans, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: IBM Plex Mono, monospace;
  --radius: 1.5rem;
  --shadow-x: 0px;
  --shadow-y: 8px;
  --shadow-blur: 16px;
  --shadow-spread: -4px;
  --shadow-opacity: 0.08;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 8px 16px -4px hsl(0 0% 0% / 0.04);
  --shadow-xs: 0px 8px 16px -4px hsl(0 0% 0% / 0.04);
  --shadow-sm: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 1px 2px -5px hsl(0 0% 0% / 0.08);
  --shadow: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 1px 2px -5px hsl(0 0% 0% / 0.08);
  --shadow-md: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 2px 4px -5px hsl(0 0% 0% / 0.08);
  --shadow-lg: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 4px 6px -5px hsl(0 0% 0% / 0.08);
  --shadow-xl: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 8px 10px -5px hsl(0 0% 0% / 0.08);
  --shadow-2xl: 0px 8px 16px -4px hsl(0 0% 0% / 0.20);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2161 0.0061 56.0434);
  --foreground: oklch(0.9299 0.0334 272.7879);
  --card: oklch(0.2805 0.0309 307.2326);
  --card-foreground: oklch(0.9299 0.0334 272.7879);
  --popover: oklch(0.2805 0.0309 307.2326);
  --popover-foreground: oklch(0.9299 0.0334 272.7879);
  --primary: oklch(0.7874 0.1179 295.7538);
  --primary-foreground: oklch(0.2161 0.0061 56.0434);
  --secondary: oklch(0.3416 0.0444 308.8496);
  --secondary-foreground: oklch(0.8717 0.0093 258.3382);
  --muted: oklch(0.2283 0.0375 302.9006);
  --muted-foreground: oklch(0.7137 0.0192 261.3246);
  --accent: oklch(0.3858 0.0509 304.6383);
  --accent-foreground: oklch(0.8717 0.0093 258.3382);
  --destructive: oklch(0.8077 0.1035 19.5706);
  --destructive-foreground: oklch(0.2161 0.0061 56.0434);
  --border: oklch(0.3416 0.0444 308.8496);
  --input: oklch(0.3416 0.0444 308.8496);
  --ring: oklch(0.7874 0.1179 295.7538);
  --chart-1: oklch(0.7874 0.1179 295.7538);
  --chart-2: oklch(0.7090 0.1592 293.5412);
  --chart-3: oklch(0.6056 0.2189 292.7172);
  --chart-4: oklch(0.5413 0.2466 293.0090);
  --chart-5: oklch(0.4907 0.2412 292.5809);
  --sidebar: oklch(0.3416 0.0444 308.8496);
  --sidebar-foreground: oklch(0.9299 0.0334 272.7879);
  --sidebar-primary: oklch(0.7874 0.1179 295.7538);
  --sidebar-primary-foreground: oklch(0.2161 0.0061 56.0434);
  --sidebar-accent: oklch(0.3858 0.0509 304.6383);
  --sidebar-accent-foreground: oklch(0.8717 0.0093 258.3382);
  --sidebar-border: oklch(0.3416 0.0444 308.8496);
  --sidebar-ring: oklch(0.7874 0.1179 295.7538);
  --font-sans: Open Sans, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: IBM Plex Mono, monospace;
  --radius: 1.5rem;
  --shadow-x: 0px;
  --shadow-y: 8px;
  --shadow-blur: 16px;
  --shadow-spread: -4px;
  --shadow-opacity: 0.08;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 8px 16px -4px hsl(0 0% 0% / 0.04);
  --shadow-xs: 0px 8px 16px -4px hsl(0 0% 0% / 0.04);
  --shadow-sm: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 1px 2px -5px hsl(0 0% 0% / 0.08);
  --shadow: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 1px 2px -5px hsl(0 0% 0% / 0.08);
  --shadow-md: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 2px 4px -5px hsl(0 0% 0% / 0.08);
  --shadow-lg: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 4px 6px -5px hsl(0 0% 0% / 0.08);
  --shadow-xl: 0px 8px 16px -4px hsl(0 0% 0% / 0.08), 0px 8px 10px -5px hsl(0 0% 0% / 0.08);
  --shadow-2xl: 0px 8px 16px -4px hsl(0 0% 0% / 0.20);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```