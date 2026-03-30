import { ref } from 'vue'
import { useApi } from './useApi'
import { useToast } from './useToast'

const currentPassword = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

export function useChangePassword() {
    const api = useApi()
    const toast = useToast()

    async function changePassword(): Promise<void> {
        isLoading.value = true
        error.value = null
        success.value = false

        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword.value,
                password: password.value,
                password_confirmation: passwordConfirmation.value,
            })

            success.value = true
            toast.success('Password has been changed successfully')
            reset()
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Password change failed'
            toast.error(error.value)
        } finally {
            isLoading.value = false
        }
    }

    function reset(): void {
        currentPassword.value = ''
        password.value = ''
        passwordConfirmation.value = ''
        error.value = null
        success.value = false
    }

    return {
        currentPassword,
        password,
        passwordConfirmation,
        isLoading,
        error,
        success,
        changePassword,
        reset,
    }
}
