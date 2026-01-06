/**
 * Theme utilities and chart color configurations
 * Following clean code principles - centralized theme management
 */

// Chart color palette for consistent data visualization
export const chartColors = {
    primary: 'var(--chart-1)',
    secondary: 'var(--chart-2)',
    tertiary: 'var(--chart-3)',
    quaternary: 'var(--chart-4)',
    quinary: 'var(--chart-5)',
} as const;

// Array of chart colors for iteration
export const chartColorArray = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
] as const;

// Status to color mapping
export type StatusType = 'done' | 'in-progress' | 'pending' | 'overdue' | 'cancelled';

export const statusConfig: Record<StatusType, {
    color: string;
    bgColor: string;
    label: string;
    dotClass: string;
}> = {
    done: {
        color: 'text-success',
        bgColor: 'bg-success/10',
        label: 'Done',
        dotClass: 'status-dot-success',
    },
    'in-progress': {
        color: 'text-info',
        bgColor: 'bg-info/10',
        label: 'In Progress',
        dotClass: 'status-dot-info',
    },
    pending: {
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        label: 'Pending',
        dotClass: 'bg-muted-foreground',
    },
    overdue: {
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        label: 'Overdue',
        dotClass: 'status-dot-destructive',
    },
    cancelled: {
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        label: 'Cancelled',
        dotClass: 'bg-muted-foreground',
    },
};

/**
 * Get status configuration by status type
 */
export function getStatusConfig(status: StatusType) {
    return statusConfig[status] || statusConfig.pending;
}

// Trend to color mapping
export type TrendType = 'up' | 'down' | 'neutral';

export const trendConfig: Record<TrendType, {
    color: string;
    textClass: string;
    icon: string;
}> = {
    up: {
        color: 'var(--success)',
        textClass: 'text-trend-up',
        icon: 'trending-up',
    },
    down: {
        color: 'var(--destructive)',
        textClass: 'text-trend-down',
        icon: 'trending-down',
    },
    neutral: {
        color: 'var(--muted-foreground)',
        textClass: 'text-trend-neutral',
        icon: 'minus',
    },
};

/**
 * Get trend configuration
 */
export function getTrendConfig(trend: TrendType) {
    return trendConfig[trend] || trendConfig.neutral;
}

/**
 * Determine trend type based on percentage change
 */
export function getTrendFromChange(change: number): TrendType {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
}

/**
 * Generate chart gradient definition for SVG
 */
export function generateChartGradient(id: string, color: string, opacity = 0.3) {
    return {
        id,
        x1: '0',
        y1: '0',
        x2: '0',
        y2: '1',
        stops: [
            { offset: '0%', color, opacity },
            { offset: '100%', color, opacity: 0 },
        ],
    };
}

/**
 * Color palette for generating colors dynamically
 */
export const colorPalette = {
    blue: { hue: 220, saturation: 70, lightness: 60 },
    green: { hue: 145, saturation: 65, lightness: 55 },
    yellow: { hue: 45, saturation: 90, lightness: 60 },
    red: { hue: 0, saturation: 75, lightness: 55 },
    purple: { hue: 270, saturation: 60, lightness: 60 },
    cyan: { hue: 190, saturation: 80, lightness: 55 },
    orange: { hue: 25, saturation: 85, lightness: 55 },
    pink: { hue: 330, saturation: 70, lightness: 60 },
} as const;

/**
 * Generate a color from the palette
 */
export function generateColor(
    paletteName: keyof typeof colorPalette,
    variant: 'normal' | 'light' | 'dark' = 'normal'
): string {
    const { hue, saturation, lightness } = colorPalette[paletteName];

    let adjustedLightness = lightness;
    if (variant === 'light') adjustedLightness += 20;
    if (variant === 'dark') adjustedLightness -= 20;

    return `hsl(${hue}, ${saturation}%, ${adjustedLightness}%)`;
}

/**
 * Generate an array of colors for charts
 */
export function generateChartColors(count: number): string[] {
    const colors: string[] = [];
    const paletteKeys = Object.keys(colorPalette) as (keyof typeof colorPalette)[];

    for (let i = 0; i < count; i++) {
        const paletteKey = paletteKeys[i % paletteKeys.length];
        colors.push(generateColor(paletteKey));
    }

    return colors;
}
