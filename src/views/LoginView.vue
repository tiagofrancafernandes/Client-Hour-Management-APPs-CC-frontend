<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { login, loading, error } = useAuth();

const email = ref('');
const password = ref('');

async function handleSubmit() {
    if (!email.value || !password.value) {
        return;
    }

    const success = await login({
        email: email.value,
        password: password.value,
    });

    if (success) {
        const redirectTo = (router.currentRoute.value.query.redirect as string) || '/';
        router.push(redirectTo);
    }
}
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div class="w-full max-w-md">
            <div class="rounded-lg bg-white p-8 shadow-lg">
                <div class="mb-6 text-center">
                    <h1 class="text-2xl font-bold text-gray-900">Hours Ledger</h1>
                    <p class="mt-1 text-gray-600">Sign in to your account</p>
                </div>

                <form @submit.prevent="handleSubmit">
                    <div v-if="error" class="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                        {{ error }}
                    </div>

                    <div class="mb-4">
                        <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            v-model="email"
                            type="email"
                            autocomplete="email"
                            required
                            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div class="mb-6">
                        <label for="password" class="mb-1 block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            v-model="password"
                            type="password"
                            autocomplete="current-password"
                            required
                            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        :disabled="loading"
                        class="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        <span v-if="loading">Signing in...</span>
                        <span v-else>Sign in</span>
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>
