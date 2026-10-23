import type { Invoice } from '@/types';

/**
 * Format invoice code in standard #C{client_id}-I{client_invoice_number} format
 * Example: #C12-I005
 */
export function formatInvoiceCode(invoice?: Partial<Invoice> | null): string {
    if (!invoice) {
        return '—';
    }

    if (invoice.formatted_code) {
        return invoice.formatted_code;
    }

    if (invoice.code) {
        return `#${invoice.code}`;
    }

    if (invoice.client_id && invoice.client_invoice_number) {
        const paddedNumber = String(invoice.client_invoice_number).padStart(3, '0');
        return `#C${invoice.client_id}-I${paddedNumber}`;
    }

    if (invoice.invoice_number) {
        return `#${invoice.invoice_number}`;
    }

    return '—';
}

/**
 * Get CSS badge classes for invoice statuses
 */
export function getInvoiceStatusBadgeClass(status?: string): string {
    const classes: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-700 border-gray-200',
        sent: 'bg-blue-50 text-blue-700 border-blue-200',
        paid: 'bg-green-50 text-green-700 border-green-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200',
    };

    return classes[status || 'draft'] || 'bg-gray-100 text-gray-700 border-gray-200';
}

/**
 * Format date into localized human-readable string
 */
export function formatInvoiceDate(dateString?: string | null): string {
    if (!dateString) {
        return '—';
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Get standard filename for invoice downloads (Markdown, PDF)
 * Example: invoice-C12-I005.pdf
 */
export function getInvoiceDownloadFilename(
    invoice?: { code?: string; invoice_number?: string | number } | null,
    extension: 'md' | 'pdf' = 'md'
): string {
    const raw = invoice?.code || (invoice?.invoice_number ? String(invoice.invoice_number) : '') || 'invoice';
    const clean = raw.replace(/^#/, '');
    const base = clean.toLowerCase().startsWith('invoice-') ? clean : `invoice-${clean}`;
    return `${base}.${extension}`;
}
