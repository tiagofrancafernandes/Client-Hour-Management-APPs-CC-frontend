import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';

export function useAuth() {
    const authStore = useAuthStore();

    const { user, role, permissions, token, loading, error, initialized, isAuthenticated } = storeToRefs(authStore);

    return {
        // Reactive state
        user,
        role,
        permissions,
        token,
        loading,
        error,
        initialized,
        isAuthenticated,

        // Actions
        login: authStore.login,
        logout: authStore.logout,
        validateToken: authStore.validateToken,
        initialize: authStore.initialize,

        // Permission helpers
        hasPermission: authStore.can,
        hasAnyPermission: authStore.canAny,
        hasAllPermissions: authStore.canAll,
        hasRole: authStore.hasRole,
        hasAnyRole: authStore.hasAnyRole,

        // Aliases for backwards compatibility
        can: authStore.can,
        canAny: authStore.canAny,
        canAll: authStore.canAll,
    };
}
