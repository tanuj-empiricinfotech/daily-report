export interface ThemeConfig {
  name: string;
  label: string;
  description: string;
  icon: string;
  fonts: string[];
  swatches: {
    light: [string, string, string];
    dark: [string, string, string];
  };
}

export const THEMES: readonly ThemeConfig[] = [
  {
    name: 'default',
    label: 'Default',
    description: 'Clean neutral theme with modern aesthetic',
    icon: 'IconPalette',
    fonts: [],
    swatches: {
      light: ['oklch(1 0 0)', 'oklch(0.2050 0 0)', 'oklch(0.9700 0 0)'],
      dark: ['oklch(0.1450 0 0)', 'oklch(0.9220 0 0)', 'oklch(0.2690 0 0)'],
    },
  },
  {
    name: 'notebook',
    label: 'Notebook',
    description: 'Handwritten, casual aesthetic',
    icon: 'IconNotebook',
    fonts: ['Architects Daughter'],
    swatches: {
      light: [
        'oklch(0.9821 0 0)',
        'oklch(0.4891 0 0)',
        'oklch(0.9354 0.0456 94.8549)',
      ],
      dark: [
        'oklch(0.2891 0 0)',
        'oklch(0.7572 0 0)',
        'oklch(0.9067 0 0)',
      ],
    },
  },
  {
    name: 'pale-garden',
    label: 'Pale Garden',
    description: 'Muted natural colors with sage greens',
    icon: 'IconPlant',
    fonts: ['Antic', 'Signifier', 'JetBrains Mono'],
    swatches: {
      light: [
        'oklch(0.9761 0.0041 91.4461)',
        'oklch(0.6333 0.0309 154.9039)',
        'oklch(0.8242 0.0221 136.6092)',
      ],
      dark: [
        'oklch(0.1448 0 0)',
        'oklch(0.6333 0.0309 154.9039)',
        'oklch(0.3709 0.0248 153.9823)',
      ],
    },
  },
  {
    name: 'vintage-paper',
    label: 'Vintage Paper',
    description: 'Warm paper-like aesthetic with serif fonts',
    icon: 'IconBook',
    fonts: ['Libre Baskerville', 'Lora', 'IBM Plex Mono'],
    swatches: {
      light: [
        'oklch(0.9582 0.0152 90.2357)',
        'oklch(0.6180 0.0778 65.5444)',
        'oklch(0.8348 0.0426 88.8064)',
      ],
      dark: [
        'oklch(0.2747 0.0139 57.6523)',
        'oklch(0.7264 0.0581 66.6967)',
        'oklch(0.4186 0.0281 56.3404)',
      ],
    },
  },
  {
    name: 'pastel-dreams',
    label: 'Pastel Dreams',
    description: 'Soft pastel colors with dreamy aesthetics',
    icon: 'IconSparkles',
    fonts: ['Open Sans', 'Source Serif 4', 'IBM Plex Mono'],
    swatches: {
      light: [
        'oklch(0.9689 0.0090 314.7819)',
        'oklch(0.7090 0.1592 293.5412)',
        'oklch(0.9376 0.0260 321.9388)',
      ],
      dark: [
        'oklch(0.2161 0.0061 56.0434)',
        'oklch(0.7874 0.1179 295.7538)',
        'oklch(0.3858 0.0509 304.6383)',
      ],
    },
  },
] as const;

export type ThemeName = typeof THEMES[number]['name'];
