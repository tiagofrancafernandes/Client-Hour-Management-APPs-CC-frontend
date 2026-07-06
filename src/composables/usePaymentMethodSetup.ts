import { computed, ref } from 'vue';
import type { PaymentMethodConfig } from '@/types';

export interface SetupFieldRule {
    name: string;
    label: string;
    type: 'string' | 'integer' | 'number' | 'boolean' | 'select';
    required: boolean;
    min?: number;
    max?: number;
    options?: Array<{ label: string; value: string | number }>;
}

export function usePaymentMethodSetup(config: PaymentMethodConfig) {
    const setupFields = ref<Record<string, any>>(config.setup_fields || {});
    const setupDefaults = ref<Record<string, any>>(config.setup_field_defaults || {});
    const setupFieldRules = ref<SetupFieldRule[]>(config.setup_field_rules || []);

    const mergedSetupFields = computed(() => {
        const merged: Record<string, any> = {};

        for (const rule of setupFieldRules.value) {
            const fieldName = rule.name;
            const userValue = setupFields.value[fieldName];
            const defaultValue = setupDefaults.value[fieldName];

            const hasUserValue = userValue !== undefined && userValue !== null && userValue !== '';
            merged[fieldName] = hasUserValue ? userValue : defaultValue;
        }

        return merged;
    });

    function updateSetupField(fieldName: string, value: any): void {
        setupFields.value[fieldName] = value;
    }

    function clearSetupField(fieldName: string): void {
        delete setupFields.value[fieldName];
    }

    function getFieldRule(fieldName: string): SetupFieldRule | undefined {
        return setupFieldRules.value.find((rule) => rule.name === fieldName);
    }

    function getFieldLabel(fieldName: string): string {
        const rule = getFieldRule(fieldName);
        return rule?.label || fieldName;
    }

    function getFieldPlaceholder(fieldName: string): string {
        const defaultValue = setupDefaults.value[fieldName];

        if (!defaultValue) {
            return '';
        }

        return `Padrão: ${defaultValue}`;
    }

    const hasRequiredFields = computed(() => {
        return setupFieldRules.value.some((rule) => rule.required);
    });

    return {
        setupFieldRules,
        setupFields,
        setupDefaults,
        mergedSetupFields,
        updateSetupField,
        clearSetupField,
        getFieldRule,
        getFieldLabel,
        getFieldPlaceholder,
        hasRequiredFields,
    };
}
