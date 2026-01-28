<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTags } from '@/composables/useTags';
import type { Tag } from '@/types';

interface Props {
    modelValue?: number[];
    placeholder?: string;
    allowCreate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    placeholder: 'Add tags...',
    allowCreate: true,
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: number[]): void;
}>();

const { tags: allTags, fetchTags, createTag } = useTags();

const inputValue = ref('');
const showDropdown = ref(false);
const isCreating = ref(false);

const selectedTags = computed(() => {
    return allTags.value.filter((tag) => props.modelValue.includes(tag.id));
});

const filteredTags = computed(() => {
    if (!inputValue.value.trim()) {
        return allTags.value.filter((tag) => !props.modelValue.includes(tag.id));
    }

    const searchLower = inputValue.value.toLowerCase().trim();

    return allTags.value.filter((tag) => {
        const isNotSelected = !props.modelValue.includes(tag.id);
        const matchesSearch = tag.name.toLowerCase().includes(searchLower);

        return isNotSelected && matchesSearch;
    });
});

const exactMatchExists = computed(() => {
    const searchLower = inputValue.value.toLowerCase().trim();

    if (!searchLower) {
        return true;
    }

    return allTags.value.some((tag) => tag.name.toLowerCase() === searchLower);
});

watch(inputValue, (newValue) => {
    if (newValue.trim()) {
        showDropdown.value = true;
    } else {
        showDropdown.value = false;
    }
});

async function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    const lastChar = value.slice(-1);

    if (lastChar === ',') {
        await handleCreateTag(value.slice(0, -1).trim());

        return;
    }

    inputValue.value = value;

    await fetchTags(value.trim());
}

async function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault();

        const trimmedValue = inputValue.value.trim();

        if (!trimmedValue) {
            return;
        }

        if (filteredTags.value.length === 1) {
            const firstTag = filteredTags.value[0];

            if (firstTag !== undefined) {
                addTag(firstTag);
            }

            return;
        }

        if (props.allowCreate && !exactMatchExists.value) {
            await handleCreateTag(trimmedValue);

            return;
        }

        const exactMatch = allTags.value.find((tag) => tag.name.toLowerCase() === trimmedValue.toLowerCase());

        if (exactMatch !== undefined) {
            addTag(exactMatch);
        }
    }

    if (event.key === 'Escape') {
        showDropdown.value = false;
        inputValue.value = '';
    }
}

async function handleCreateTag(tagName: string) {
    if (!tagName || !props.allowCreate) {
        return;
    }

    if (exactMatchExists.value) {
        const existingTag = allTags.value.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());

        if (existingTag && !props.modelValue.includes(existingTag.id)) {
            addTag(existingTag);
        }

        inputValue.value = '';

        return;
    }

    isCreating.value = true;

    try {
        const newTag = await createTag(tagName);

        addTag(newTag);

        inputValue.value = '';
    } catch (error) {
        console.error('Failed to create tag:', error);
    } finally {
        isCreating.value = false;
    }
}

function addTag(tag: Tag) {
    if (props.modelValue.includes(tag.id)) {
        return;
    }

    const newValue = [...props.modelValue, tag.id];

    emit('update:modelValue', newValue);

    inputValue.value = '';
    showDropdown.value = false;
}

function removeTag(tagId: number) {
    const newValue = props.modelValue.filter((id) => id !== tagId);

    emit('update:modelValue', newValue);
}

function handleDropdownClick(tag: Tag) {
    addTag(tag);
}

function handleInputFocus() {
    if (inputValue.value.trim()) {
        showDropdown.value = true;
    }
}

function handleInputBlur() {
    setTimeout(() => {
        showDropdown.value = false;
    }, 200);
}
</script>

<template>
    <div class="relative">
        <div class="flex flex-wrap gap-2 rounded-lg border border-gray-300 p-2 focus-within:border-blue-500">
            <span
                v-for="tag in selectedTags"
                :key="tag.id"
                class="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-700"
            >
                {{ tag.name }}
                <button
                    type="button"
                    class="text-blue-700 hover:text-blue-900"
                    @click="removeTag(tag.id)"
                >
                    ×
                </button>
            </span>

            <input
                v-model="inputValue"
                type="text"
                class="flex-1 border-none bg-transparent px-1 py-1 text-sm outline-none"
                :placeholder="selectedTags.length === 0 ? placeholder : ''"
                :disabled="isCreating"
                @input="handleInput"
                @keydown="handleKeydown"
                @focus="handleInputFocus"
                @blur="handleInputBlur"
            />
        </div>

        <div
            v-if="showDropdown && (filteredTags.length > 0 || (allowCreate && inputValue.trim() && !exactMatchExists))"
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
            <button
                v-for="tag in filteredTags"
                :key="tag.id"
                type="button"
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                @click="handleDropdownClick(tag)"
            >
                {{ tag.name }}
            </button>

            <button
                v-if="allowCreate && inputValue.trim() && !exactMatchExists"
                type="button"
                class="w-full border-t border-gray-200 px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
                @click="handleCreateTag(inputValue.trim())"
            >
                Create "{{ inputValue.trim() }}"
            </button>
        </div>

        <p v-if="allowCreate" class="mt-1 text-xs text-gray-500">
            Type and press Enter or comma to create a new tag
        </p>
    </div>
</template>
