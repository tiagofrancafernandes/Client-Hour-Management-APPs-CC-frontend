<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import type { ProductService, ProductServiceForm } from '@/types';
import { useProductsServices } from '@/composables/useProductsServices';
import { useToast } from '@/composables/useToast';
import { formatCurrency } from '@utils/payment-helpers';
import CButton from '@/components/CButton.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import ProductServiceModal from '@/components/ProductServiceModal.vue';

const toast = useToast();
const {
    productsServices,
    loading,
    pagination,
    canCreate,
    canUpdate,
    canDelete,
    fetchProductsServices,
    createProductService,
    updateProductService,
    deleteProductService,
} = useProductsServices();

const filters = ref({
    search: '',
    type: '' as '' | 'product' | 'service',
    is_active: '' as '' | 'true' | 'false',
});

const sortBy = ref('name');
const sortDirection = ref<'asc' | 'desc'>('asc');
const perPage = ref(15);
const currentPage = ref(1);

const isModalOpen = ref(false);
const editingItem = ref<ProductService | null>(null);
const modalSaving = ref(false);

const isDeleteModalOpen = ref(false);
const itemToDelete = ref<ProductService | null>(null);
const isDeleting = ref(false);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const activeFiltersCount = computed(() => {
    let count = 0;
    if (filters.value.search) {
        count++;
    }
    if (filters.value.type) {
        count++;
    }
    if (filters.value.is_active !== '') {
        count++;
    }
    return count;
});

async function loadData(): Promise<void> {
    const activeVal =
        filters.value.is_active === 'true' ? true : filters.value.is_active === 'false' ? false : undefined;

    await fetchProductsServices({
        search: filters.value.search || undefined,
        type: filters.value.type || undefined,
        is_active: activeVal,
        sort_by: sortBy.value,
        sort_direction: sortDirection.value,
        per_page: perPage.value,
        page: currentPage.value,
    });
}

function handleSearchInput(): void {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
        loadData();
    }, 350);
}

function handleFilterChange(): void {
    currentPage.value = 1;
    loadData();
}

function handleClearFilters(): void {
    filters.value = {
        search: '',
        type: '',
        is_active: '',
    };
    currentPage.value = 1;
    loadData();
}

function handleSort(column: string): void {
    if (sortBy.value === column) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortBy.value = column;
        sortDirection.value = 'asc';
    }
    currentPage.value = 1;
    loadData();
}

function handlePageChange(page: number): void {
    if (page < 1 || page > pagination.value.lastPage) {
        return;
    }
    currentPage.value = page;
    loadData();
}

function handlePerPageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    perPage.value = Number(target.value);
    currentPage.value = 1;
    loadData();
}

function openCreateModal(): void {
    editingItem.value = null;
    isModalOpen.value = true;
}

function openEditModal(item: ProductService): void {
    editingItem.value = item;
    isModalOpen.value = true;
}

function closeModal(force: boolean = false): void {
    if (modalSaving.value && !force) {
        return;
    }
    isModalOpen.value = false;
    editingItem.value = null;
}

async function handleSaveItem(data: ProductServiceForm, id?: number, keepOpen?: boolean): Promise<void> {
    modalSaving.value = true;
    try {
        if (id) {
            await updateProductService(id, data);
            toast.success('Catalog item updated successfully');
            closeModal(true);
        } else {
            await createProductService(data);
            toast.success('Catalog item created successfully');
            if (!keepOpen) {
                closeModal(true);
            }
        }
        await loadData();
    } catch (err: any) {
        toast.error(err?.message || 'Failed to save item');
    } finally {
        modalSaving.value = false;
    }
}

function confirmDelete(item: ProductService): void {
    itemToDelete.value = item;
    isDeleteModalOpen.value = true;
}

function cancelDelete(): void {
    isDeleteModalOpen.value = false;
    itemToDelete.value = null;
}

async function executeDelete(): Promise<void> {
    if (!itemToDelete.value) {
        return;
    }
    isDeleting.value = true;
    try {
        await deleteProductService(itemToDelete.value.id);
        toast.success(`"${itemToDelete.value.name}" deleted successfully`);
        cancelDelete();
        await loadData();
    } catch {
        toast.error('Failed to delete catalog item');
    } finally {
        isDeleting.value = false;
    }
}

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="container mx-auto px-4 py-6 max-w-7xl">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
                <h1 class="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                    <Icon icon="mdi:format-list-bulleted-type" class="w-5 h-5 text-red-600" />
                    Products & Services
                </h1>
                <p class="text-xs text-slate-500 mt-0.5">
                    Manage standard billable products, consultation rates, and service presets for invoices
                </p>
            </div>

            <div class="flex items-center gap-2">
                <button
                    type="button"
                    @click="loadData"
                    :disabled="loading"
                    class="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                    title="Refresh List"
                >
                    <Icon icon="mdi:refresh" :class="['w-3.5 h-3.5', { 'animate-spin': loading }]" />
                </button>

                <CButton v-if="canCreate" preset="red" @click="openCreateModal">
                    <Icon icon="mdi:plus" class="w-3.5 h-3.5 mr-1" />
                    <span>New Item</span>
                </CButton>
            </div>
        </div>

        <!-- Filter Bar -->
        <div class="bg-white rounded-xl border border-gray-200 p-3.5 mb-5 shadow-2xs space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                <!-- Search Input -->
                <div class="md:col-span-6 relative">
                    <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                        <Icon icon="mdi:magnify" class="w-4 h-4" />
                    </span>
                    <input
                        v-model="filters.search"
                        @input="handleSearchInput"
                        type="text"
                        placeholder="Search items by name or description..."
                        class="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white transition-all text-slate-900"
                    />
                    <button
                        v-if="filters.search"
                        @click="
                            filters.search = '';
                            handleFilterChange();
                        "
                        type="button"
                        class="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                    >
                        <Icon icon="mdi:close-circle" class="w-3.5 h-3.5" />
                    </button>
                </div>

                <!-- Type Filter -->
                <div class="md:col-span-3">
                    <select
                        v-model="filters.type"
                        @change="handleFilterChange"
                        class="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white transition-all text-slate-700"
                    >
                        <option value="">All Classifications</option>
                        <option value="service">Services Only</option>
                        <option value="product">Products Only</option>
                    </select>
                </div>

                <!-- Status Filter -->
                <div class="md:col-span-3">
                    <select
                        v-model="filters.is_active"
                        @change="handleFilterChange"
                        class="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white transition-all text-slate-700"
                    >
                        <option value="">All Statuses</option>
                        <option value="true">Active Only</option>
                        <option value="false">Inactive Only</option>
                    </select>
                </div>
            </div>

            <div
                v-if="activeFiltersCount > 0"
                class="flex items-center justify-between pt-2 border-t border-gray-100 text-xs"
            >
                <span class="text-gray-500 font-medium">
                    {{ activeFiltersCount }} active {{ activeFiltersCount === 1 ? 'filter' : 'filters' }}
                </span>
                <button
                    type="button"
                    @click="handleClearFilters"
                    class="text-red-600 hover:text-red-700 font-medium cursor-pointer inline-flex items-center gap-1"
                >
                    <Icon icon="mdi:filter-remove-outline" class="w-3.5 h-3.5" />
                    Clear Filters
                </button>
            </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr
                            class="bg-slate-50 border-b border-gray-200 text-2xs font-semibold text-slate-500 uppercase tracking-wider select-none"
                        >
                            <th
                                @click="handleSort('name')"
                                class="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <div class="flex items-center gap-1">
                                    <span>Item & Description</span>
                                    <Icon
                                        v-if="sortBy === 'name'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>
                            <th
                                @click="handleSort('type')"
                                class="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors w-28"
                            >
                                <div class="flex items-center gap-1">
                                    <span>Type</span>
                                    <Icon
                                        v-if="sortBy === 'type'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>
                            <th
                                @click="handleSort('unit')"
                                class="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors w-24"
                            >
                                <div class="flex items-center gap-1">
                                    <span>Unit</span>
                                    <Icon
                                        v-if="sortBy === 'unit'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>
                            <th
                                @click="handleSort('default_price')"
                                class="py-2.5 px-3.5 text-right cursor-pointer hover:bg-slate-100 transition-colors w-28"
                            >
                                <div class="flex items-center justify-end gap-1">
                                    <span>Default Price</span>
                                    <Icon
                                        v-if="sortBy === 'default_price'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>
                            <th
                                @click="handleSort('default_quantity')"
                                class="py-2.5 px-3.5 text-center cursor-pointer hover:bg-slate-100 transition-colors w-24"
                            >
                                <div class="flex items-center justify-center gap-1">
                                    <span>Def. Qty</span>
                                    <Icon
                                        v-if="sortBy === 'default_quantity'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>
                            <th
                                @click="handleSort('is_active')"
                                class="py-2.5 px-3.5 text-center cursor-pointer hover:bg-slate-100 transition-colors w-24"
                            >
                                <div class="flex items-center justify-center gap-1">
                                    <span>Status</span>
                                    <Icon
                                        v-if="sortBy === 'is_active'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>
                            <th class="py-2.5 px-3.5 text-right w-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-xs">
                        <tr v-if="loading && productsServices.length === 0">
                            <td colspan="7" class="py-12 text-center text-slate-500">
                                <Icon icon="mdi:loading" class="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                                <span>Loading catalog items...</span>
                            </td>
                        </tr>

                        <tr v-else-if="productsServices.length === 0">
                            <td colspan="7" class="py-12 text-center text-slate-500">
                                <Icon icon="mdi:package-variant-closed" class="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                <p class="text-xs font-semibold text-slate-700">No items found</p>
                                <p class="text-2xs text-slate-400 mt-0.5">
                                    Try adjusting your search filters or create a new catalog item
                                </p>
                                <div class="mt-3" v-if="canCreate">
                                    <CButton preset="red" @click="openCreateModal">
                                        <Icon icon="mdi:plus" class="w-3.5 h-3.5 mr-1" />
                                        <span>Create First Item</span>
                                    </CButton>
                                </div>
                            </td>
                        </tr>

                        <tr
                            v-for="item in productsServices"
                            :key="item.id"
                            class="hover:bg-slate-50/70 transition-colors"
                        >
                            <td class="py-2.5 px-3.5">
                                <div class="font-medium text-slate-900 text-xs sm:text-[13px]">{{ item.name }}</div>
                                <div v-if="item.description" class="text-2xs text-slate-500 line-clamp-1 mt-0.5">
                                    {{ item.description }}
                                </div>
                            </td>

                            <td class="py-2.5 px-3.5">
                                <span
                                    :class="[
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium border',
                                        {
                                            'bg-purple-50 text-purple-700 border-purple-200': item.type === 'service',
                                            'bg-blue-50 text-blue-700 border-blue-200': item.type === 'product',
                                        },
                                    ]"
                                >
                                    <Icon
                                        :icon="item.type === 'service' ? 'mdi:briefcase-outline' : 'mdi:cube-outline'"
                                        class="w-3 h-3"
                                    />
                                    {{ item.type === 'service' ? 'Service' : 'Product' }}
                                </span>
                            </td>

                            <td class="py-2.5 px-3.5">
                                <span
                                    class="font-mono text-2xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60"
                                >
                                    {{ item.unit || 'unit' }}
                                </span>
                            </td>

                            <td class="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900 text-xs">
                                {{ formatCurrency(item.default_price, 'USD') }}
                            </td>

                            <td class="py-2.5 px-3.5 text-center text-xs font-mono text-slate-600">
                                {{ item.default_quantity || '1.00' }}
                            </td>

                            <td class="py-2.5 px-3.5 text-center">
                                <span
                                    :class="[
                                        'inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium border',
                                        {
                                            'bg-emerald-50 text-emerald-700 border border-emerald-200': item.is_active,
                                            'bg-slate-100 text-slate-600 border-slate-200': !item.is_active,
                                        },
                                    ]"
                                >
                                    {{ item.is_active ? 'Active' : 'Inactive' }}
                                </span>
                            </td>

                            <td class="py-2.5 px-3.5 text-right">
                                <div class="flex items-center justify-end gap-1">
                                    <button
                                        v-if="canUpdate"
                                        type="button"
                                        @click="openEditModal(item)"
                                        class="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                        title="Edit item"
                                    >
                                        <Icon icon="mdi:pencil-outline" class="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        v-if="canDelete"
                                        type="button"
                                        @click="confirmDelete(item)"
                                        class="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                        title="Delete item"
                                    >
                                        <Icon icon="mdi:trash-can-outline" class="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination Bar -->
            <div
                v-if="pagination.total > 0"
                class="px-4 py-3 border-t border-gray-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600"
            >
                <div class="flex items-center gap-3">
                    <span>
                        Showing
                        <strong class="text-gray-900">
                            {{ (pagination.currentPage - 1) * pagination.perPage + 1 }}
                        </strong>
                        to
                        <strong class="text-gray-900">
                            {{ Math.min(pagination.currentPage * pagination.perPage, pagination.total) }}
                        </strong>
                        of
                        <strong class="text-gray-900">{{ pagination.total }}</strong>
                        results
                    </span>

                    <div class="flex items-center gap-1.5 border-l border-gray-200 pl-3">
                        <span>Per page:</span>
                        <select
                            :value="perPage"
                            @change="handlePerPageChange"
                            class="py-1 px-2 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                        >
                            <option :value="10">10</option>
                            <option :value="15">15</option>
                            <option :value="25">25</option>
                            <option :value="50">50</option>
                            <option :value="100">100</option>
                        </select>
                    </div>
                </div>

                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        :disabled="currentPage <= 1 || loading"
                        @click="handlePageChange(currentPage - 1)"
                        class="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        Previous
                    </button>

                    <span class="px-2 font-medium text-gray-700">
                        Page {{ pagination.currentPage }} of {{ pagination.lastPage }}
                    </span>

                    <button
                        type="button"
                        :disabled="currentPage >= pagination.lastPage || loading"
                        @click="handlePageChange(currentPage + 1)"
                        class="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <ProductServiceModal
            :show="isModalOpen"
            :item="editingItem"
            :loading="modalSaving"
            @close="closeModal"
            @save="handleSaveItem"
        />

        <ConfirmModal
            :is-open="isDeleteModalOpen"
            title="Delete Catalog Item"
            :message="`Are you sure you want to delete '${itemToDelete?.name}'? This action cannot be undone.`"
            confirm-text="Delete Item"
            cancel-text="Cancel"
            variant="danger"
            @confirm="executeDelete"
            @cancel="cancelDelete"
            @close="cancelDelete"
        />
    </div>
</template>
