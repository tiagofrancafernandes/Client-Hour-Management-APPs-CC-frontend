import { ref } from 'vue';
import api from '@/services/api';
import type { User, ClientUserForm, UpdateClientUserForm } from '@/types';

export function useClientUsers() {
    const users = ref<User[]>([]);
    const user = ref<User | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchClientUsers(clientId: number) {
        loading.value = true;
        error.value = null;

        try {
            users.value = await api.get<User[]>(`/clients/${clientId}/users`);
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Erro ao buscar usuários';
        } finally {
            loading.value = false;
        }
    }

    async function createClientUser(clientId: number, data: ClientUserForm) {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.post<{ user: User }>(`/clients/${clientId}/users`, data);

            users.value.push(response.user);

            return response.user;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Erro ao criar usuário';

            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function updateClientUser(clientId: number, userId: number, data: UpdateClientUserForm) {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.put<{ user: User }>(`/clients/${clientId}/users/${userId}`, data);

            const index = users.value.findIndex((u) => u.id === userId);

            if (index !== -1) {
                users.value[index] = response.user;
            }

            return response.user;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Erro ao atualizar usuário';

            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function deleteClientUser(clientId: number, userId: number) {
        loading.value = true;
        error.value = null;

        try {
            await api.delete(`/clients/${clientId}/users/${userId}`);

            users.value = users.value.filter((u) => u.id !== userId);
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Erro ao deletar usuário';

            throw e;
        } finally {
            loading.value = false;
        }
    }

    return {
        users,
        user,
        loading,
        error,
        fetchClientUsers,
        createClientUser,
        updateClientUser,
        deleteClientUser,
    };
}
