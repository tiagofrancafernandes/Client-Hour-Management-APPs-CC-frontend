import { computed } from 'vue';
import { useAuth } from './useAuth';

export function usePermissions() {
    const auth = useAuth();

    const canViewClients = computed(() => {
        return auth.hasAnyPermission(['view_clients', 'manage_clients']);
    });

    const canManageClients = computed(() => {
        return auth.hasPermission('manage_clients');
    });

    const canViewWallets = computed(() => {
        return auth.hasAnyPermission(['view_wallets', 'manage_wallets']);
    });

    const canManageWallets = computed(() => {
        return auth.hasPermission('manage_wallets');
    });

    const canViewLedger = computed(() => {
        return auth.hasAnyPermission(['view_ledger', 'manage_ledger']);
    });

    const canManageLedger = computed(() => {
        return auth.hasPermission('manage_ledger');
    });

    const canAddCredits = computed(() => {
        return auth.hasPermission('add_credits');
    });

    const canAddDebits = computed(() => {
        return auth.hasPermission('add_debits');
    });

    const canAddAdjustments = computed(() => {
        return auth.hasPermission('add_adjustments');
    });

    const canViewTags = computed(() => {
        return auth.hasAnyPermission(['view_tags', 'manage_tags']);
    });

    const canManageTags = computed(() => {
        return auth.hasPermission('manage_tags');
    });

    const canViewReports = computed(() => {
        return auth.hasAnyPermission(['view_reports', 'view_all_reports']);
    });

    const canViewAllReports = computed(() => {
        return auth.hasPermission('view_all_reports');
    });

    const isSuperAdmin = computed(() => {
        return auth.hasRole('super_admin');
    });

    const isAdmin = computed(() => {
        return auth.hasAnyRole(['super_admin', 'admin']);
    });

    return {
        canViewClients,
        canManageClients,
        canViewWallets,
        canManageWallets,
        canViewLedger,
        canManageLedger,
        canAddCredits,
        canAddDebits,
        canAddAdjustments,
        canViewTags,
        canManageTags,
        canViewReports,
        canViewAllReports,
        isSuperAdmin,
        isAdmin,

        hasPermission: auth.hasPermission,
        hasAnyPermission: auth.hasAnyPermission,
        hasAllPermissions: auth.hasAllPermissions,
        hasRole: auth.hasRole,
        hasAnyRole: auth.hasAnyRole,
    };
}
