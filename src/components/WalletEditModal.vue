<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { WalletWithBalance } from '@/types';
import { useWallets } from '@/composables/useWallets';
import { useToast } from '@/composables/useToast';

const props = defineProps<{
    show: boolean;
    wallet: WalletWithBalance | null;
}>();

const emit = defineEmits<{
    close: [];
    updated: [];
}>();

const { updateWallet, loading: updating } = useWallets();
const toast = useToast();

const form = ref({
    name: '',
    description: '',
    hourly_rate_reference: '',
    currency_code: 'USD',
});

const isSubmitting = computed(() => updating.value);

// Common currency codes
const currencyCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL'];

watch(
    () => props.wallet,
    (newWallet) => {
        if (newWallet) {
            form.value = {
                name: newWallet.name,
                description: newWallet.description || '',
                hourly_rate_reference: newWallet.hourly_rate_reference ? String(newWallet.hourly_rate_reference) : '',
                currency_code: newWallet.currency_code || 'USD',
            };
        }
    },
    { immediate: true }
);

async function handleSubmit() {
    if (!props.wallet || !form.value.name.trim()) {
        toast.error('Wallet name is required');
        return;
    }

    try {
        await updateWallet(props.wallet.id, {
            name: form.value.name,
            description: form.value.description || undefined,
            hourly_rate_reference: form.value.hourly_rate_reference ? parseFloat(form.value.hourly_rate_reference) : undefined,
            currency_code: form.value.currency_code || undefined,
        });

        toast.success('Wallet updated successfully');
        emit('updated');
        emit('close');
    } catch {
        toast.error('Failed to update wallet');
    }
}

function handleClose() {
    emit('close');
}
</script>

<template>
    <div v-if="show && wallet" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <!-- Header -->
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Edit Wallet</h2>
                <button class="text-gray-400 hover:text-gray-600" :disabled="isSubmitting" @click="handleClose">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Form -->
            <form class="space-y-4" @submit.prevent="handleSubmit">
                <!-- Name -->
                <div>
                    <label for="name" class="mb-1 block text-sm font-medium text-gray-700">Wallet Name *</label>
                    <input
                        id="name"
                        v-model="form.name"
                        type="text"
                        required
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        :disabled="isSubmitting"
                    />
                </div>

                <!-- Description -->
                <div>
                    <label for="description" class="mb-1 block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        id="description"
                        v-model="form.description"
                        rows="3"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        :disabled="isSubmitting"
                    ></textarea>
                </div>

                <!-- Hourly Rate Reference -->
                <div>
                    <label for="hourly_rate" class="mb-1 block text-sm font-medium text-gray-700">Hourly Rate Reference</label>
                    <input
                        id="hourly_rate"
                        v-model="form.hourly_rate_reference"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        :disabled="isSubmitting"
                    />
                </div>

                <!-- Currency Code -->
                <div>
                    <label for="currency_code" class="mb-1 block text-sm font-medium text-gray-700">Currency Code</label>
                    <select
                        id="currency_code"
                        v-model="form.currency_code"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        :disabled="isSubmitting"
                    >
                        <option value="">Select currency...</option>
                        <option v-for="code in currencyCodes" :key="code" :value="code">
                            {{ code }}
                        </option>
                    </select>
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                        :disabled="isSubmitting"
                        @click="handleClose"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        :disabled="isSubmitting"
                    >
                        {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
