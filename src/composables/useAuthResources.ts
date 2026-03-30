import { ref, computed } from 'vue'
import { useApi } from './useApi'

const authResources = ref({
    self_register: false,
    self_recovery_password: false,
})

const isLoading = ref(false)
const error = ref<string | null>(null)

export function useAuthResources() {
    const api = useApi()

    const canRegister = computed(() => authResources.value.self_register)
    const canRecoverPassword = computed(() => authResources.value.self_recovery_password)

    async function fetchAuthResources(): Promise<void> {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get('/auth/resources')
            authResources.value = response.data
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch auth resources'
            console.error('Error fetching auth resources:', err)
        } finally {
            isLoading.value = false
        }
    }

    return {
        canRegister,
        canRecoverPassword,
        isLoading,
        error,
        fetchAuthResources,
        authResources,
    }
}
