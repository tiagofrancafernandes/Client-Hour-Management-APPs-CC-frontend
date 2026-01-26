export interface Client {
    id: number;
    name: string;
    notes: string | null;
    total_balance?: string;
    wallets?: WalletWithBalance[];
    created_at: string;
    updated_at: string;
}

export interface Wallet {
    id: number;
    client_id: number;
    name: string;
    description: string | null;
    hourly_rate_reference: string | null;
    client?: Client;
    created_at: string;
    updated_at: string;
}

export interface WalletWithBalance extends Wallet {
    balance: string;
}

export interface Tag {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface LedgerEntry {
    id: number;
    wallet_id: number;
    hours: string;
    title: string | null;
    description: string | null;
    reference_date: string | null;
    wallet?: Wallet;
    tags?: Tag[];
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface ReportSummary {
    total_credits: string;
    total_debits: string;
    net_balance: string;
    entry_count: number;
}

export interface ReportFilters {
    client_id?: number;
    wallet_id?: number;
    date_from?: string;
    date_to?: string;
    tags?: number[];
    type?: 'credit' | 'debit';
    group_by?: 'wallet' | 'client';
    per_page?: number;
}

export interface LedgerEntryForm {
    wallet_id: number;
    type: 'credit' | 'debit' | 'adjustment';
    hours: number;
    title?: string;
    description?: string;
    reference_date?: string;
    tags?: number[];
}
