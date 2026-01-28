<script setup lang="ts">
import { computed } from 'vue';
import { buttonPresets } from '@/tw-ui/presets';

const props = defineProps({
    label: {
        type: String,
        default: () => null,
    },
    preset: {
        type: String,
        default: 'blue',
    },
});

const classes = computed(() => {
    const presets: any = buttonPresets();

    return presets[props.preset] ?? presets.blue;
});
</script>

<template>
    <button :class="classes">
        <template v-if="props?.label === null">
            <slot />
        </template>
    </button>
</template>
