<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useTags } from '@/composables/useTags';

const { tags, loading, error, fetchTags, createTag, deleteTag } = useTags();

const showCreateModal = ref(false);
const newTagName = ref('');

onMounted(() => {
    fetchTags();
});

async function handleCreate() {
    if (!newTagName.value.trim()) {
        return;
    }

    try {
        await createTag(newTagName.value);

        showCreateModal.value = false;
        newTagName.value = '';
    } catch {
        // Error handled in composable
    }
}

async function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this tag?')) {
        await deleteTag(id);
    }
}
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">Tags</h1>
            <button
                class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                @click="showCreateModal = true"
            >
                New Tag
            </button>
        </div>

        <div v-if="error" class="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {{ error }}
        </div>

        <div v-if="loading" class="py-8 text-center">Loading...</div>

        <div v-else class="flex flex-wrap gap-2">
            <div
                v-for="tag in tags"
                :key="tag.id"
                class="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow"
            >
                <span class="text-gray-900">{{ tag.name }}</span>
                <button class="text-red-500 hover:text-red-700" @click="handleDelete(tag.id)">×</button>
            </div>
        </div>

        <div v-if="!loading && !tags.length" class="py-8 text-center text-gray-500">
            No tags yet. Create one to start categorizing entries.
        </div>

        <!-- Create Modal -->
        <div v-if="showCreateModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div class="w-full max-w-md rounded-lg bg-white p-6">
                <h2 class="mb-4 text-lg font-semibold">New Tag</h2>
                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Name</label>
                    <input
                        v-model="newTagName"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        @keyup.enter="handleCreate"
                    />
                </div>
                <div class="flex justify-end gap-2">
                    <button
                        class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                        @click="showCreateModal = false"
                    >
                        Cancel
                    </button>
                    <button class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" @click="handleCreate">
                        Create
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
