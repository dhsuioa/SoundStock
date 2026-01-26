/**
 * Formats a number with thousands separators.
 * @param {number} num 
 * @returns {string} e.g. "1,234,567"
 */
export const formatNumber = (num: number): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Formats a number as a concise currency-like string.
 * Used for large volumes/market caps.
 * @param {number} num 
 * @returns {string} e.g. "1.2M", "500K"
 */
export const formatCompactNumber = (num: number): string => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(num);
}

/**
 * Formats data for the UI
 */
export const formatCurrency = (num: number): string => {
    return formatNumber(num);
}
