<script setup lang="ts">
import { computed } from 'vue';
import { selectPresets, selectLabelPresets } from '@/tw-ui/presets';
import { useSlots, useAttrs } from 'vue';

const attrs = useAttrs();

const props = defineProps({
    label: {
        type: String,
        default: () => 'Select',
    },
    type: {
        type: String,
        default: () => 'text',
    },
    required: {
        type: Boolean,
        default: () => false,
    },
    disabled: {
        type: Boolean,
        default: () => false,
    },
    labelClasses: {
        type: [String, Object, Array],
        default: () => null,
    },
    preset: {
        type: String,
        default: 'default',
    },
});

const classes = computed(() => {
    const presets: any = selectPresets();

    let _classes: any = [presets[props.preset] ?? presets.default];

    return _classes;
});

const labelClasses = computed(() => {
    let _classes: any = [
        // 'block text-sm font-medium text-gray-700 mb-2',
        // 'block text-sm font-medium text-gray-700 mb-1',
        // selectLabelPresets()?.default,
        selectLabelPresets()?.mb1,
        props?.labelClasses,
    ];

    return _classes;
});

const modelValue = defineModel<string | number | undefined>();
</script>

<template>
    <div data-component-name="CInput">
        <label :class="labelClasses">
            <template v-if="props?.label === null">
                <slot name="label" />
            </template>
            <template v-else>
                {{ props?.label || '' }}
            </template>
        </label>
        <input
            v-model="modelValue"
            v-bind="{
                ...attrs,
                class: classes,
                type: type,
                required: props?.required,
                disabled: props?.disabled,
            }"
        />
    </div>
</template>
