export interface DashboardStatsClients {
    total: number;
    this_month: number;
}

export interface DashboardStatsWallets {
    total: number;
    this_month: number;
}

export interface DashboardStatsLedger {
    total_entries: number;
    entries_this_month: number;
    net_hours: number;
    credit_hours: number;
    debit_hours: number;
    hours_this_month: number;
}

export interface DashboardStatsInvoices {
    total: number;
    this_month: number;
    total_amount: number;
    by_status: {
        draft: number;
        sent: number;
        paid: number;
        overdue: number;
    };
}

export interface DashboardStatsProductsServices {
    total: number;
    active: number;
}

export interface DashboardStatsTimers {
    active_count: number;
}

export interface DashboardStats {
    clients: DashboardStatsClients;
    wallets: DashboardStatsWallets;
    ledger: DashboardStatsLedger;
    invoices: DashboardStatsInvoices;
    products_services: DashboardStatsProductsServices;
    timers: DashboardStatsTimers;
    cached_at: string;
}

export interface DashboardRecentEntryTag {
    id: number;
    name: string;
    color?: string | null;
}

export interface DashboardRecentEntry {
    id: number;
    hours: number;
    title: string | null;
    description: string | null;
    reference_date: string | null;
    created_at: string | null;
    wallet: {
        id: number | null;
        name: string;
    };
    client: {
        id: number | null;
        name: string;
    };
    tags: DashboardRecentEntryTag[];
}

export interface DashboardRecentClient {
    id: number;
    name: string;
    business_name: string | null;
    email: string | null;
    phone: string | null;
    wallets_count: number;
    created_at: string | null;
}

export interface DashboardRecentInvoice {
    id: number;
    code: string;
    formatted_code: string;
    invoice_number: number;
    client: {
        id: number | null;
        name: string;
    };
    status: string;
    total: number;
    currency: string;
    issue_date: string | null;
    due_date: string | null;
    created_at: string | null;
}

export interface RecentQueryParams {
    order_by?: string;
    order_direction?: 'asc' | 'desc';
    limit?: number;
    refresh?: boolean;
}

