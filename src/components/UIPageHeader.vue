<template>
    <div class="flex items-center justify-between mb-8">
        <div>
            <template v-if="$slots?.title">
                <h1 class="text-3xl font-bold text-gray-900"><slot name="title" /></h1>
            </template>
            <template v-else>
                <h1 class="text-3xl font-bold text-gray-900">{{ props.title || '' }}</h1>
            </template>

            <template v-if="$slots?.description">
                <p class="mt-2 text-gray-600"><slot name="description" /></p>
            </template>
            <template v-else>
                <p class="mt-2 text-gray-600">{{ props.description || '' }}</p>
            </template>
        </div>

        <div data-slot="actions" class="flex items-center justify-between mb-8 gap-3">
            <slot name="actions" />

            <CButton v-if="false" preset="primary" @click="() => console.log('clicked')" icon="mdi:upload">
                Action
            </CButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    title: {
        type: String,
        default: () => null,
    },
    description: {
        type: String,
        default: () => null,
    },
});
</script>
