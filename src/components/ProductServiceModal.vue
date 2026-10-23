<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import type { ProductService, ProductServiceForm } from '@/types';
import CButton from '@/components/CButton.vue';

interface Props {
    show: boolean;
    item: ProductService | null;
    loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
});

const emit = defineEmits<{
    close: [];
    save: [data: ProductServiceForm, id?: number, keepOpen?: boolean];
}>();

const isEditing = computed(() => !!props.item);

const commonUnits = ['unit', 'hour', 'day', 'month', 'project', 'license'];

const keepOpen = ref<boolean>(false);

const form = ref<ProductServiceForm>({
    name: '',
    description: '',
    type: 'service',
    unit: 'unit',
    default_price: 0,
    default_quantity: 1,
    is_active: true,
});

function resetForm(): void {
    form.value = {
        name: '',
        description: '',
        type: 'service',
        unit: 'hour',
        default_price: 0,
        default_quantity: 1,
        is_active: true,
    };
}

const isFormValid = computed(() => {
    if (!form.value.name.trim()) {
        return false;
    }

    if (form.value.default_price === undefined || form.value.default_price === null || form.value.default_price < 0) {
        return false;
    }

    return true;
});

watch(
    () => props.show,
    (isOpen) => {
        if (!isOpen) {
            resetForm();
            return;
        }

        if (props.item) {
            keepOpen.value = false;
            form.value = {
                name: props.item.name,
                description: props.item.description || '',
                type: props.item.type,
                unit: props.item.unit || 'unit',
                default_price: Number(props.item.default_price) || 0,
                default_quantity: Number(props.item.default_quantity) || 1,
                is_active: props.item.is_active ?? true,
            };
            return;
        }

        resetForm();
    },
    { immediate: true }
);

function selectUnit(unit: string): void {
    form.value.unit = unit;
}

function handleClose(): void {
    if (props.loading) {
        return;
    }

    resetForm();
    emit('close');
}

function handleSubmit(): void {
    if (!isFormValid.value || props.loading) {
        return;
    }

    const shouldKeepOpen = !isEditing.value && keepOpen.value;
    emit('save', { ...form.value }, props.item?.id, shouldKeepOpen);
}
</script>

<template>
    <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
        <div
            class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200"
        >
            <!-- Fixed Header -->
            <div
                class="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70"
            >
                <div class="flex items-center gap-3">
                    <div
                        :class="[
                            'w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs',
                            {
                                'bg-purple-50 border-purple-200 text-purple-700': form.type === 'service',
                                'bg-blue-50 border-blue-200 text-blue-700': form.type === 'product',
                            },
                        ]"
                    >
                        <Icon
                            :icon="form.type === 'service' ? 'mdi:briefcase-outline' : 'mdi:cube-outline'"
                            class="w-5 h-5"
                        />
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-slate-900">
                            {{ isEditing ? 'Edit Product / Service' : 'New Product / Service' }}
                        </h2>
                        <p class="text-xs text-slate-500">
                            {{
                                isEditing
                                    ? `Update catalog item #${item?.id}`
                                    : 'Create a reusable catalog item for invoices'
                            }}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    @click="handleClose"
                    :disabled="loading"
                    class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                    <Icon icon="mdi:close" class="w-5 h-5" />
                </button>
            </div>

            <!-- Scrollable Content -->
            <form
                @submit.prevent="handleSubmit"
                id="productServiceForm"
                class="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm"
            >
                <!-- Type Selection (Segmented Control) -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Item Classification
                        <span class="text-red-500">*</span>
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            @click="form.type = 'service'"
                            :class="[
                                'flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                                {
                                    'border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/20 shadow-xs':
                                        form.type === 'service',
                                    'border-slate-200 hover:border-slate-300 bg-white': form.type !== 'service',
                                },
                            ]"
                        >
                            <div
                                :class="[
                                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                    {
                                        'bg-purple-600 text-white': form.type === 'service',
                                        'bg-slate-100 text-slate-500': form.type !== 'service',
                                    },
                                ]"
                            >
                                <Icon icon="mdi:briefcase-outline" class="w-4 h-4" />
                            </div>
                            <div>
                                <span class="block text-sm font-bold text-slate-900">Service</span>
                                <span class="block text-2xs text-slate-500">Hourly consulting, support, labor</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            @click="form.type = 'product'"
                            :class="[
                                'flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                                {
                                    'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs':
                                        form.type === 'product',
                                    'border-slate-200 hover:border-slate-300 bg-white': form.type !== 'product',
                                },
                            ]"
                        >
                            <div
                                :class="[
                                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                    {
                                        'bg-blue-600 text-white': form.type === 'product',
                                        'bg-slate-100 text-slate-500': form.type !== 'product',
                                    },
                                ]"
                            >
                                <Icon icon="mdi:cube-outline" class="w-4 h-4" />
                            </div>
                            <div>
                                <span class="block text-sm font-bold text-slate-900">Product</span>
                                <span class="block text-2xs text-slate-500">Deliverable, item, software license</span>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Name -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Item Name
                        <span class="text-red-500">*</span>
                    </label>
                    <input
                        v-model="form.name"
                        type="text"
                        required
                        placeholder="e.g. Senior Software Consulting, Maintenance Plan..."
                        class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                </div>

                <!-- Description -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Description
                    </label>
                    <textarea
                        v-model="form.description"
                        rows="3"
                        placeholder="Provide optional details, deliverables, or specifications..."
                        class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-y"
                    ></textarea>
                </div>

                <!-- Unit & Quick Pills -->
                <div>
                    <div class="flex items-center justify-between mb-1.5">
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Billing Unit
                        </label>
                        <span class="text-2xs text-slate-400">e.g. unit, hour, month, project</span>
                    </div>
                    <input
                        v-model="form.unit"
                        type="text"
                        placeholder="unit, hour, month..."
                        class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all mb-2"
                    />
                    <div class="flex flex-wrap items-center gap-1.5">
                        <span class="text-2xs text-slate-500 mr-1">Suggestions:</span>
                        <button
                            v-for="u in commonUnits"
                            :key="u"
                            type="button"
                            @click="selectUnit(u)"
                            :class="[
                                'px-2 py-0.5 rounded-md text-2xs font-medium border transition-colors cursor-pointer',
                                {
                                    'bg-slate-900 text-white border-slate-900': form.unit === u,
                                    'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200': form.unit !== u,
                                },
                            ]"
                        >
                            {{ u }}
                        </button>
                    </div>
                </div>

                <!-- Pricing & Default Quantity -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Default Price
                            <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <span
                                class="absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-400 pointer-events-none"
                            >
                                $
                            </span>
                            <input
                                v-model.number="form.default_price"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                placeholder="0.00"
                                class="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Default Quantity
                        </label>
                        <input
                            v-model.number="form.default_quantity"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="1"
                            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <!-- Active Toggle -->
                <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <span class="block text-sm font-bold text-slate-900">Active in Catalog</span>
                        <span class="block text-2xs text-slate-500">
                            Available for selection when building new invoices
                        </span>
                    </div>

                    <button
                        type="button"
                        role="switch"
                        :aria-checked="form.is_active"
                        @click="form.is_active = !form.is_active"
                        :class="[
                            'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
                            {
                                'bg-green-600': form.is_active,
                                'bg-slate-300': !form.is_active,
                            },
                        ]"
                    >
                        <span
                            :class="[
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                {
                                    'translate-x-5': form.is_active,
                                    'translate-x-0': !form.is_active,
                                },
                            ]"
                        />
                    </button>
                </div>
            </form>

            <!-- Fixed Footer / Actions -->
            <div
                class="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0"
            >
                <div v-if="!isEditing" class="flex items-center gap-2">
                    <input
                        id="keep-modal-open"
                        v-model="keepOpen"
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <label for="keep-modal-open" class="text-xs font-medium text-slate-700 cursor-pointer select-none">
                        Keep form open to add another
                    </label>
                </div>
                <div v-else></div>

                <div class="flex items-center justify-end gap-3">
                    <CButton preset="outlined-black" type="button" :disabled="loading" @click="handleClose">
                        Cancel
                    </CButton>
                    <CButton preset="red" type="submit" form="productServiceForm" :disabled="loading || !isFormValid">
                        <Icon v-if="loading" icon="mdi:loading" class="w-4 h-4 animate-spin mr-1.5" />
                        <span>{{ isEditing ? 'Save Changes' : keepOpen ? 'Create & Add Another' : 'Create Item' }}</span>
                    </CButton>
                </div>
            </div>
        </div>
    </div>
</template>
