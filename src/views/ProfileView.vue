<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { user, role } = useAuth();
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <button class="mb-4 text-blue-600 hover:text-blue-800" @click="router.back()">← Back</button>

        <div class="mx-auto max-w-2xl">
            <div class="rounded-lg bg-white p-6 shadow">
                <h1 class="mb-6 text-2xl font-bold text-gray-900">Profile</h1>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-500">Name</label>
                        <p class="mt-1 text-lg text-gray-900">{{ user?.name }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500">Email</label>
                        <p class="mt-1 text-lg text-gray-900">{{ user?.email }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-500">Role</label>
                        <p class="mt-1">
                            <span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                {{ role || 'No role assigned' }}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
