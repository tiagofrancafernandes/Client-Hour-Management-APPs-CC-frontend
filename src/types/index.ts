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
    internal_note?: string | null;
    hourly_rate_reference: string | null;
    currency_code: string | null;
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
    client_id?: number | null;
    wallet_id?: number | null;
    date_from?: string;
    date_to?: string;
    tags?: number[];
    type?: 'credit' | 'debit' | null;
    group_by?: 'wallet' | 'client' | null;
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

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface AuthState {
    user: User | null;
    role: string | null;
    permissions: string[];
    token: string | null;
    isAuthenticated: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    role: string | null;
    permissions: string[];
    token: string;
}

export interface ValidateTokenResponse {
    valid: boolean;
    user: User;
    role: string | null;
    permissions: string[];
}

export type TimerStatus = 'running' | 'paused' | 'stopped' | 'confirmed' | 'cancelled';

export interface TimerCycle {
    id: number;
    timer_id: number;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number;
    created_at: string;
    updated_at: string;
}

export interface Timer {
    id: number;
    user_id: number;
    wallet_id: number;
    title: string | null;
    description: string | null;
    status: TimerStatus;
    confirmed_at: string | null;
    ledger_entry_id: number | null;
    total_seconds: number;
    formatted_duration: string;
    total_hours: number;
    cycles: TimerCycle[];
    wallet?: Wallet;
    tags?: Tag[];
    ledger_entry?: LedgerEntry;
    created_at: string;
    updated_at: string;
}

export interface TimerForm {
    wallet_id: number;
    title?: string;
    description?: string;
    tags?: number[];
}

export interface TimerCycleForm {
    id?: number;
    started_at: string;
    ended_at?: string | null;
}

export type ImportPlanStatus = 'pending' | 'validated' | 'confirmed' | 'cancelled';

export interface ImportPlanSummary {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    total_hours: number;
}

export interface ImportPlanRow {
    id: number;
    import_plan_id: number;
    row_number: number;
    reference_date: string;
    hours: number;
    title: string;
    description: string | null;
    tags: string[];
    validation_errors: string[];
    is_valid: boolean;
    ledger_entry_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface ImportPlan {
    id: number;
    user_id: number;
    wallet_id: number;
    original_filename: string;
    file_path: string;
    status: ImportPlanStatus;
    summary: ImportPlanSummary | null;
    validation_errors: string[] | null;
    confirmed_at: string | null;
    user?: User;
    wallet?: Wallet;
    rows?: ImportPlanRow[];
    created_at: string;
    updated_at: string;
}

export interface ImportPlanForm {
    wallet_id: number;
    file: File;
}

export interface ImportRowForm {
    reference_date: string;
    hours: number;
    title: string;
    description?: string;
    tags?: string[];
}
