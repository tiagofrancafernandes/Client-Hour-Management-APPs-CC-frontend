import type { CreditPurchasePayment, PaymentMethod } from '@/types';

/**
 * Format currency amount with currency code symbol
 */
export function formatCurrency(amount: string | number | null | undefined, code = 'USD'): string {
    if (amount === null || amount === undefined || amount === '') {
        return '—';
    }

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) {
        return '—';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
    }).format(numericAmount);
}

/**
 * Format a date string to localized readable format (e.g. "Oct 23, 2026")
 */
export function formatDate(date: string | null | undefined): string {
    if (!date) {
        return '—';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
        return '—';
    }

    return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Check if a credit purchase payment has expired
 */
export function isPaymentExpired(payment: CreditPurchasePayment | null | undefined): boolean {
    if (!payment || !payment.expires_at) {
        return false;
    }

    const expiresAtTime = new Date(payment.expires_at).getTime();

    if (isNaN(expiresAtTime)) {
        return false;
    }

    const diff = expiresAtTime - Date.now();

    if (diff <= 0) {
        return true;
    }

    return false;
}

/**
 * Format remaining time until expiration (e.g. "2d 4h", "5h 30m", "45m", "Expired")
 */
export function formatExpiresAt(expiresAt: string | null | undefined): string {
    if (!expiresAt) {
        return 'No expiration';
    }

    const expiresAtTime = new Date(expiresAt).getTime();

    if (isNaN(expiresAtTime)) {
        return 'No expiration';
    }

    const diff = expiresAtTime - Date.now();

    if (diff <= 0) {
        return 'Expired';
    }

    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    }

    if (hours > 0) {
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        return `${hours}h ${minutes}m`;
    }

    return `${Math.floor(diff / 60_000)}m`;
}

/**
 * Get Iconify icon name corresponding to a payment method key
 */
export function getPaymentMethodIcon(key?: string): string {
    if (!key) {
        return 'mdi:credit-card-outline';
    }

    if (key.includes('pix')) {
        return 'mdi:qrcode-scan';
    }

    if (key.includes('bank') || key.includes('transfer')) {
        return 'mdi:bank-outline';
    }

    return 'mdi:credit-card-outline';
}

/**
 * Get readable label for a payment method
 */
export function getPaymentMethodLabel(method: PaymentMethod | null | undefined): string {
    if (!method) {
        return 'Not selected';
    }

    return method.label;
}

/**
 * Get badge color classes for payment status
 */
export function getPaymentStatusColor(status: string): string {
    const map: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        completed: 'bg-blue-100 text-blue-800',
    };

    return map[status] ?? 'bg-gray-100 text-gray-700';
}

/**
 * Get badge color classes for purchase status
 */
export function getPurchaseStatusColor(status: string): string {
    const map: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-700',
    };

    return map[status] ?? 'bg-gray-100 text-gray-700';
}

