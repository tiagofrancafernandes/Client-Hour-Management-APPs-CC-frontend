import { ref } from 'vue';
import { api } from '@/services/api';
import type { User, Role, PaginatedResponse } from '@/types';

export interface UserDetail {
    user: User;
    direct_permissions: string[];
    role_permissions: string[];
}

export interface UserOptions {
    roles: string[];
    permissions: string[];
}

export function useUsers() {
    const users = ref<User[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchUsers(params: Record<string, unknown> = {}): Promise<PaginatedResponse<User>> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get<PaginatedResponse<User>>('/users', params);

            users.value = response.data;

            return response;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch users';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function fetchUser(id: number): Promise<UserDetail> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get<UserDetail>(`/users/${id}`);

            return response;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch user';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function updateUser(id: number, data: { name: string; email: string }): Promise<User> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.put<{ user: User }>(`/users/${id}`, data);

            return response.user;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to update user';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function updateUserRole(id: number, role: string): Promise<User> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.put<{ user: User }>(`/users/${id}/role`, { role });

            return response.user;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to update role';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function updateUserPermissions(id: number, permissions: string[]): Promise<string[]> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.put<{ direct_permissions: string[] }>(`/users/${id}/permissions`, {
                permissions,
            });

            return response.direct_permissions;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to update permissions';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function fetchOptions(): Promise<UserOptions> {
        try {
            const response = await api.get<UserOptions>('/users/options');

            return response;
        } catch (e) {
            throw e;
        }
    }

    return {
        users,
        loading,
        error,
        fetchUsers,
        fetchUser,
        updateUser,
        updateUserRole,
        updateUserPermissions,
        fetchOptions,
    };
}
