<script setup lang="ts">
import { computed } from 'vue';
import { usePaymentMethodSetup, type SetupFieldRule } from '@/composables/usePaymentMethodSetup';
import type { PaymentMethodConfig } from '@/types';
import { selectPresets, selectLabelPresets } from '@/tw-ui/presets';

const props = defineProps<{
    config: PaymentMethodConfig;
}>();

const {
    setupFieldRules,
    setupFields,
    setupDefaults,
    hasRequiredFields,
    updateSetupField,
    clearSetupField,
} = usePaymentMethodSetup(props.config);

const labelClasses = computed(() => {
    return selectLabelPresets()?.mb1;
});

const getInputType = (type: string): string => {
    if (type === 'integer' || type === 'number') {
        return 'number';
    }

    if (type === 'boolean') {
        return 'checkbox';
    }

    return 'text';
};

const getInputClasses = (rule: SetupFieldRule): string => {
    const presets = selectPresets();
    const baseClasses = presets.default || 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';

    return baseClasses;
};

const getSelectClasses = (): string => {
    const presets = selectPresets();
    return presets.default || 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';
};

const getFieldValue = (rule: SetupFieldRule): any => {
    return setupFields.value[rule.name] ?? '';
};
</script>

<template>
    <div v-if="hasRequiredFields" class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-900">
                <strong>Administrative Setup Fields:</strong>
                These fields contain sensitive data (API keys, credentials) and are visible to administrators only.
            </p>
        </div>

        <div v-for="rule in setupFieldRules" :key="rule.name" class="flex flex-col gap-2">
            <label :for="rule.name" :class="labelClasses">
                {{ rule.label }}
                <span v-if="rule.required" class="text-red-500 font-bold italic">*</span>
            </label>

            <div v-if="rule.type === 'select'" class="relative">
                <select
                    :id="rule.name"
                    :value="getFieldValue(rule)"
                    :class="getSelectClasses()"
                    @change="(e) => updateSetupField(rule.name, (e.target as HTMLSelectElement).value)"
                >
                    <option value="">
                        {{ setupDefaults[rule.name] ? `Default: ${setupDefaults[rule.name]}` : 'Select an option' }}
                    </option>
                    <option
                        v-for="option in rule.options"
                        :key="option.value"
                        :value="option.value"
                    >
                        {{ option.label }}
                    </option>
                </select>
            </div>

            <div v-else-if="rule.type === 'boolean'" class="flex items-center gap-2">
                <input
                    :id="rule.name"
                    type="checkbox"
                    :checked="getFieldValue(rule)"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    @change="(e) => updateSetupField(rule.name, (e.target as HTMLInputElement).checked)"
                />
                <label :for="rule.name" class="text-sm font-medium text-gray-700">
                    {{ rule.label }}
                </label>
            </div>

            <div v-else class="relative">
                <input
                    :id="rule.name"
                    :type="getInputType(rule.type)"
                    :value="getFieldValue(rule)"
                    :placeholder="setupDefaults[rule.name] ? `Default: ${setupDefaults[rule.name]}` : ''"
                    :class="getInputClasses(rule)"
                    @input="(e) => updateSetupField(rule.name, (e.target as HTMLInputElement).value)"
                />

                <button
                    v-if="getFieldValue(rule)"
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    @click="() => clearSetupField(rule.name)"
                    :title="`Clear ${rule.label}`"
                >
                    <span class="text-lg">×</span>
                </button>
            </div>

            <div v-if="rule.min || rule.max" class="text-xs text-gray-500">
                <span v-if="rule.min && rule.max">
                    {{ rule.min }} to {{ rule.max }} characters
                </span>
                <span v-else-if="rule.min">
                    Minimum {{ rule.min }} characters
                </span>
                <span v-else-if="rule.max">
                    Maximum {{ rule.max }} characters
                </span>
            </div>
        </div>
    </div>
</template>
