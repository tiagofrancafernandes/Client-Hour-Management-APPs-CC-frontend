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
    icon: {
        type: String,
    },
    rightIcon: {
        type: String,
    },
});

const classes = computed(() => {
    const presets: any = buttonPresets();

    let _classes: any = ['inline-flex items-center gap-2', presets[props.preset] ?? presets.blue];

    if (props.icon || props.rightIcon) {
        _classes = [..._classes];
    }

    return _classes;
});
</script>

<template>
    <button :class="classes" data-component-name="CButton">
        <template v-if="props.icon">
            <UIcon :icon="props.icon" />
        </template>
        <template v-if="props?.label === null">
            <slot />
        </template>
        <template v-if="props.rightIcon">
            <UIcon :icon="props.rightIcon" />
        </template>
    </button>
</template>
