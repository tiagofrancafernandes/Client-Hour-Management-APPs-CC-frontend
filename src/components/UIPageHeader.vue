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

<template>
    <div class="flex items-start justify-between mb-5 gap-4">
        <div>
            <template v-if="$slots?.title">
                <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
                    <slot name="title" />
                </h1>
            </template>
            <template v-else>
                <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">{{ props.title || '' }}</h1>
            </template>

            <template v-if="$slots?.description">
                <p class="mt-0.5 text-xs text-slate-500 font-normal">
                    <slot name="description" />
                </p>
            </template>
            <template v-else-if="props.description">
                <p class="mt-0.5 text-xs text-slate-500 font-normal">{{ props.description }}</p>
            </template>
        </div>

        <div data-slot="actions" class="flex items-center gap-2 flex-shrink-0">
            <slot name="actions" />
        </div>
    </div>
</template>
