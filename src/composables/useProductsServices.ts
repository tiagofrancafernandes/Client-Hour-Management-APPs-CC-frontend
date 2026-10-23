import { ref, computed } from 'vue';
import api from '@/services/api';
import type { ProductService, ProductServiceForm, PaginatedResponse, GenericResponse } from '@/types';
import { useAuth } from './useAuth';

export function useProductsServices() {
    const productsServices = ref<ProductService[]>([]);
    const productService = ref<ProductService | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const pagination = ref({
        currentPage: 1,
        lastPage: 1,
        perPage: 20,
        total: 0,
    });

    const { hasPermission } = useAuth();

    const canView = computed(() => hasPermission('product_service.view_any'));
    const canCreate = computed(() => hasPermission('product_service.create'));
    const canUpdate = computed(() => hasPermission('product_service.update'));
    const canDelete = computed(() => hasPermission('product_service.delete'));

    async function fetchProductsServices(
        filters: {
            search?: string;
            type?: 'product' | 'service';
            is_active?: boolean;
            sort_by?: string;
            sort_direction?: 'asc' | 'desc';
            all?: boolean;
            per_page?: number;
            page?: number;
        } = {}
    ) {
        loading.value = true;
        error.value = null;

        try {
            const params = new URLSearchParams();

            if (filters.search) {
                params.append('search', filters.search);
            }

            if (filters.type) {
                params.append('type', filters.type);
            }

            if (filters.is_active !== undefined) {
                params.append('is_active', filters.is_active.toString());
            }

            if (filters.sort_by) {
                params.append('sort_by', filters.sort_by);
            }

            if (filters.sort_direction) {
                params.append('sort_direction', filters.sort_direction);
            }

            if (filters.all) {
                params.append('all', '1');
            }

            if (filters.per_page) {
                params.append('per_page', filters.per_page.toString());
            }

            if (filters.page) {
                params.append('page', filters.page.toString());
            }

            const response = await api.get<PaginatedResponse<ProductService>>(
                `/products-services?${params.toString()}`
            );

            if (filters.all) {
                productsServices.value = (
                    'data' in response.data ? response.data?.data : response.data
                ) as ProductService[];
                return response.data;
            }

            productsServices.value = response.data || [];
            pagination.value = {
                currentPage: response.current_page || 1,
                lastPage: response.last_page || 1,
                perPage: response.per_page || 20,
                total: response.total || 0,
            };

            return response;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch products/services';
            error.value = message;

            throw err;
        } finally {
            loading.value = false;
        }
    }

    function unwrapItem(response: any): ProductService {
        if (response && typeof response === 'object' && 'data' in response && response.data) {
            return unwrapItem(response.data);
        }

        return response as ProductService;
    }

    async function fetchProductService(id: number) {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get<any>(`/products-services/${id}`);
            const item = unwrapItem(response);
            productService.value = item;

            return item;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch product/service';
            error.value = message;

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function createProductService(data: ProductServiceForm) {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.post<any>('/products-services', data);
            const item = unwrapItem(response);
            productService.value = item;

            return item;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to create product/service';
            error.value = message;

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function updateProductService(id: number, data: Partial<ProductServiceForm>) {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.put<any>(`/products-services/${id}`, data);
            const item = unwrapItem(response);
            productService.value = item;

            return item;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update product/service';
            error.value = message;

            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function deleteProductService(id: number) {
        loading.value = true;
        error.value = null;

        try {
            await api.delete(`/products-services/${id}`);

            const index = productsServices.value.findIndex((ps) => ps.id === id);

            if (index !== -1) {
                productsServices.value.splice(index, 1);
            }

            if (productService.value?.id === id) {
                productService.value = null;
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete product/service';
            error.value = message;

            throw err;
        } finally {
            loading.value = false;
        }
    }

    return {
        productsServices,
        productService,
        loading,
        error,
        pagination,
        canView,
        canCreate,
        canUpdate,
        canDelete,
        fetchProductsServices,
        fetchProductService,
        createProductService,
        updateProductService,
        deleteProductService,
    };
}
