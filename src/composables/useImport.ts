import { ref, type Ref } from 'vue';
import api from '@/services/api';
import type { ImportPlan, ImportPlanRow, ImportPlanForm, ImportRowForm, PaginatedResponse } from '@/types';

export function useImport() {
    const importPlans: Ref<ImportPlan[]> = ref([]);
    const currentPlan: Ref<ImportPlan | null> = ref(null);
    const loading: Ref<boolean> = ref(false);
    const error: Ref<string | null> = ref(null);
    const totalPages: Ref<number> = ref(1);
    const currentPage: Ref<number> = ref(1);

    async function fetchImportPlans(page = 1, filters?: { status?: string; wallet_id?: number }): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            const params: Record<string, string | number> = {
                page: page,
            };

            if (filters?.status) {
                params.status = filters.status;
            }

            if (filters?.wallet_id) {
                params.wallet_id = filters.wallet_id;
            }

            const response = await api.get<PaginatedResponse<ImportPlan>>('/import-plans', { params });

            importPlans.value = response.data.data;
            totalPages.value = response.data.last_page;
            currentPage.value = response.data.current_page;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch import plans';

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function fetchImportPlan(id: number): Promise<ImportPlan> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get<ImportPlan>(`/import-plans/${id}`);

            currentPlan.value = response.data;

            return response.data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch import plan';

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function uploadFile(data: ImportPlanForm): Promise<ImportPlan> {
        loading.value = true;
        error.value = null;

        try {
            const formData = new FormData();

            formData.append('wallet_id', data.wallet_id.toString());
            formData.append('file', data.file);

            const response = await api.post<ImportPlan>('/import-plans', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            currentPlan.value = response.data;

            return response.data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to upload file';

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function confirmImportPlan(planId: number): Promise<ImportPlan> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.post<{ data: ImportPlan }>(`/import-plans/${planId}/confirm`);

            if (currentPlan.value && currentPlan.value.id === planId) {
                currentPlan.value = response.data.data;
            }

            return response.data.data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to confirm import plan';

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function cancelImportPlan(planId: number): Promise<ImportPlan> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.post<{ data: ImportPlan }>(`/import-plans/${planId}/cancel`);

            if (currentPlan.value && currentPlan.value.id === planId) {
                currentPlan.value = response.data.data;
            }

            return response.data.data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to cancel import plan';

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function updateRow(rowId: number, data: Partial<ImportRowForm>): Promise<ImportPlanRow> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.put<{ data: ImportPlanRow }>(`/import-plans/rows/${rowId}`, data);

            if (currentPlan.value && currentPlan.value.rows) {
                const index = currentPlan.value.rows.findIndex((row) => row.id === rowId);

                if (index !== -1) {
                    currentPlan.value.rows[index] = response.data.data;
                }

                await fetchImportPlan(currentPlan.value.id);
            }

            return response.data.data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to update row';

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function addRow(planId: number, data: ImportRowForm): Promise<ImportPlanRow> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.post<{ data: ImportPlanRow }>(`/import-plans/${planId}/rows`, data);

            if (currentPlan.value && currentPlan.value.id === planId) {
                await fetchImportPlan(planId);
            }

            return response.data.data;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to add row';

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function deleteRow(rowId: number): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            await api.delete(`/import-plans/rows/${rowId}`);

            if (currentPlan.value && currentPlan.value.rows) {
                const index = currentPlan.value.rows.findIndex((row) => row.id === rowId);

                if (index !== -1 && currentPlan.value) {
                    await fetchImportPlan(currentPlan.value.id);
                }
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to delete row';

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function downloadTemplate(format: 'csv' | 'xlsx'): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get('/import-plans/template/download', {
                params: { format },
                responseType: 'blob',
            });

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `import_template.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to download template';

            throw err;
        } finally {
            loading.value = false;
        }
    }

    return {
        importPlans,
        currentPlan,
        loading,
        error,
        totalPages,
        currentPage,
        fetchImportPlans,
        fetchImportPlan,
        uploadFile,
        confirmImportPlan,
        cancelImportPlan,
        updateRow,
        addRow,
        deleteRow,
        downloadTemplate,
    };
}
