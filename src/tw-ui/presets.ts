/**
 * Shared base styles
 */
const base = 'cursor-pointer rounded-md font-medium transition shadow-lg active:scale-[.95]';

/**
 * Size presets
 */
const sizes = {
    default: 'px-3 py-1 text-sm',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
};

/**
 * Badge / Pill base
 */
const badgeBase = 'inline-flex items-center font-medium select-none';

/**
 * Badge / Pill sizes
 */
const badgeSizes = {
    default: 'px-2 py-0.5 text-xs',
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
};

/**
 * Solid color presets
 */
const solidColors = {
    black: 'bg-neutral-950 text-white shadow-neutral-500/20',
    red: 'bg-red-600 text-white shadow-red-500/20',
    green: 'bg-green-600 text-white shadow-green-500/20',
    blue: 'bg-blue-600 text-white shadow-blue-500/20',
    sky: 'bg-sky-600 text-white shadow-sky-500/20',
    yellow: 'bg-yellow-500 text-black shadow-yellow-500/20',
    orange: 'bg-orange-600 text-white shadow-orange-500/20',

    white: 'bg-gray-50 text-neutral-900 shadow-gray-400/20 hover:bg-gray-100',

    success: 'bg-green-600 text-white shadow-green-500/20',
    danger: 'bg-red-600 text-white shadow-red-500/20',
    warning: 'bg-yellow-500 text-black shadow-yellow-500/20',
    info: 'bg-sky-600 text-white shadow-sky-500/20',
    error: 'bg-red-700 text-white shadow-red-500/30',
};

/**
 * Outlined color presets
 */
const outlinedColors = {
    black: 'border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white',
    red: 'border border-red-600 text-red-600 hover:bg-red-600 hover:text-white',
    green: 'border border-green-600 text-green-600 hover:bg-green-600 hover:text-white',
    blue: 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
    sky: 'border border-sky-600 text-sky-600 hover:bg-sky-600 hover:text-white',
    yellow: 'border border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-black',
    orange: 'border border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white',

    success: 'border border-green-600 text-green-600 hover:bg-green-600 hover:text-white',
    danger: 'border border-red-600 text-red-600 hover:bg-red-600 hover:text-white',
    warning: 'border border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-black',
    info: 'border border-sky-600 text-sky-600 hover:bg-sky-600 hover:text-white',
    error: 'border border-red-700 text-red-700 hover:bg-red-700 hover:text-white',
};

/**
 * Internal helper (buttons)
 */
function buildPresets(colors: Record<string, string>, type: 'solid' | 'outlined' = 'solid') {
    const result: Record<string, string> = {};

    Object.keys(colors).forEach((color) => {
        Object.keys(sizes).forEach((size) => {
            const prefix = type === 'outlined' ? 'outlined-' : '';
            const key = size === 'default' ? `${prefix}${color}` : `${prefix}${color}-${size}`;

            result[key] = [base, sizes[size as keyof typeof sizes], colors[color]].join(' ');
        });
    });

    return result;
}

/**
 * Internal helper (badges / pills)
 */
function buildBadgePresets(colors: Record<string, string>, rounded: string, type: 'solid' | 'outlined' = 'solid') {
    const result: Record<string, string> = {};

    Object.keys(colors).forEach((color) => {
        Object.keys(badgeSizes).forEach((size) => {
            const prefix = type === 'outlined' ? 'outlined-' : '';
            const key = size === 'default' ? `${prefix}${color}` : `${prefix}${color}-${size}`;

            result[key] = [badgeBase, rounded, badgeSizes[size as keyof typeof badgeSizes], colors[color]].join(' ');
        });
    });

    return result;
}

/**
 * Button presets
 */
export function buttonPresets() {
    return {
        ...buildPresets(solidColors),
        ...buildPresets(outlinedColors, 'outlined'),
    };
}

/**
 * Badge presets
 */
export function badgePresets() {
    return {
        ...buildBadgePresets(solidColors, 'rounded-md'),
        ...buildBadgePresets(outlinedColors, 'rounded-md', 'outlined'),
    };
}

/**
 * Pill presets
 */
export function pillPresets() {
    return {
        ...buildBadgePresets(solidColors, 'rounded-full'),
        ...buildBadgePresets(outlinedColors, 'rounded-full', 'outlined'),
    };
}

/**
 * Form presets
 */
export function selectPresets() {
    return {
        default: 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none',
    };
}

export function dateInputPresets() {
    return {
        default: 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none',
    };
}

export function textInputPresets() {
    return {
        default: 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none',
    };
}

export function textareaPresets() {
    return {
        default: 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none',
    };
}
