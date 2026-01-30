<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTimerStore } from '@/stores/timer';
import { api } from '@/services/api';
import type { WalletWithBalance, Tag } from '@/types';
import TagInput from '@/components/TagInput.vue';

const props = defineProps<{
    show: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();

const timerStore = useTimerStore();

const wallets = ref<WalletWithBalance[]>([]);
const tags = ref<Tag[]>([]);
const loading = ref(false);
const loadingWallets = ref(false);

const form = ref({
    wallet_id: null as number | null,
    title: '',
    description: '',
    tags: [] as number[],
});

const selectedWallet = computed(() => {
    if (!form.value.wallet_id) {
        return null;
    }

    const wallet = wallets.value.find((w) => w.id === form.value.wallet_id);

    return wallet || null;
});

const canSubmit = computed(() => {
    return form.value.wallet_id !== null && !loading.value;
});

async function loadWallets(): Promise<void> {
    loadingWallets.value = true;

    try {
        const response = await api.get<WalletWithBalance[]>('/wallets?with=tags,balance');

        let _data = ('data' in response ? response?.data : response) as WalletWithBalance[];

        wallets.value = Array.isArray(_data) ? _data : [];
    } catch (error) {
        console.error('Failed to load wallets:', error);
    } finally {
        loadingWallets.value = false;
    }
}

async function loadTags(): Promise<void> {
    try {
        const response = await api.get<Tag[]>('/tags');

        tags.value = response;
    } catch (error) {
        console.error('Failed to load tags:', error);
    }
}

async function handleSubmit(): Promise<void> {
    if (!canSubmit.value) {
        return;
    }

    loading.value = true;

    try {
        const success = await timerStore.startTimer({
            wallet_id: form.value.wallet_id!,
            title: form.value.title || undefined,
            description: form.value.description || undefined,
            tags: form.value.tags.length > 0 ? form.value.tags : undefined,
        });

        if (success) {
            resetForm();
            emit('close');
        }
    } finally {
        loading.value = false;
    }
}

function resetForm(): void {
    form.value = {
        wallet_id: null,
        title: '',
        description: '',
        tags: [],
    };
}

function handleClose(): void {
    if (!loading.value) {
        resetForm();
        emit('close');
    }
}

function handleTagsChange(selectedTags: number[]): void {
    form.value.tags = selectedTags;
}

onMounted(() => {
    loadWallets();
    loadTags();
});
</script>

<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="handleClose">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 class="text-xl font-semibold text-gray-900">Start Timer</h2>
                <button
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                    :disabled="loading"
                    @click="handleClose"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <!-- Body -->
            <form class="p-6 space-y-4" @submit.prevent="handleSubmit">
                <!-- Wallet Selection -->
                <div>
                    <label for="wallet" class="block text-sm font-medium text-gray-700 mb-1">
                        Wallet
                        <span class="text-red-600">*</span>
                    </label>
                    <select
                        id="wallet"
                        v-model="form.wallet_id"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                        :disabled="loadingWallets || loading"
                        required
                    >
                        <option :value="null">
                            {{ loadingWallets ? 'Loading...' : 'Select a wallet' }}
                        </option>
                        <option
                            v-if="Object.keys(wallets || {}).length"
                            v-for="wallet in wallets"
                            :key="wallet?.id"
                            :value="wallet?.id"
                        >
                            {{ wallet?.client?.name }} - {{ wallet?.name }}
                            <template v-if="wallet?.balance !== undefined">({{ wallet?.balance }}h)</template>
                        </option>
                    </select>
                </div>

                <!-- Title -->
                <div>
                    <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        id="title"
                        v-model="form.title"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                        placeholder="What are you working on?"
                        :disabled="loading"
                    />
                </div>

                <!-- Description -->
                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        id="description"
                        v-model="form.description"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
                        placeholder="Add more details..."
                        :disabled="loading"
                    ></textarea>
                </div>

                <!-- Tags -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <TagInput
                        :available-tags="tags"
                        :selected-tags="form.tags"
                        @update:selected-tags="handleTagsChange"
                    />
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-4">
                    <button
                        type="button"
                        class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                        :disabled="loading"
                        @click="handleClose"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        :class="[
                            'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                            {
                                'bg-red-600 hover:bg-red-700 text-white': canSubmit,
                                'bg-gray-300 text-gray-500 cursor-not-allowed': !canSubmit,
                            },
                        ]"
                        :disabled="!canSubmit"
                    >
                        {{ loading ? 'Starting...' : 'Start Timer' }}
                    </button>
                </div>
            </form>

            <!-- Error Message -->
            <div v-if="timerStore.error" class="mx-6 mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-600">{{ timerStore.error }}</p>
            </div>
        </div>
    </div>
</template>
