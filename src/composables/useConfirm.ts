import { ref, type Ref } from 'vue';

export interface ConfirmOptions {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
}

export interface ConfirmState extends ConfirmOptions {
    isOpen: boolean;
}

interface ConfirmCallbacks {
    resolve: (value: boolean) => void;
    reject: () => void;
}

const state: Ref<ConfirmState> = ref({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'info',
});

let callbacks: ConfirmCallbacks | null = null;

export function useConfirm() {
    function confirm(options: ConfirmOptions | string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (typeof options === 'string') {
                state.value = {
                    isOpen: true,
                    title: 'Confirmar ação',
                    message: options,
                    confirmText: 'Confirmar',
                    cancelText: 'Cancelar',
                    variant: 'info',
                };
            } else {
                state.value = {
                    isOpen: true,
                    title: options.title || 'Confirmar ação',
                    message: options.message || 'Tem certeza que deseja continuar?',
                    confirmText: options.confirmText || 'Confirmar',
                    cancelText: options.cancelText || 'Cancelar',
                    variant: options.variant || 'info',
                };
            }

            callbacks = { resolve, reject };
        });
    }

    function handleConfirm(): void {
        if (callbacks) {
            callbacks.resolve(true);
            callbacks = null;
        }

        state.value.isOpen = false;
    }

    function handleCancel(): void {
        if (callbacks) {
            callbacks.resolve(false);
            callbacks = null;
        }

        state.value.isOpen = false;
    }

    return {
        state,
        confirm,
        handleConfirm,
        handleCancel,
    };
}
