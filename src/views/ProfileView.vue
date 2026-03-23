<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { user, role, permissions } = useAuth();

const groupPermissionsByResource = computed(() => {
    return permissions.value.reduce((groups: Record<string, string[]>, permission: string) => {
        const [group] = permission.split('.', 1);

        if (!group) {
            return groups;
        }

        if (!groups[group]) {
            groups[group] = [];
        }

        groups[group].push(permission);

        return groups;
    }, {});
});
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <button class="mb-4 text-blue-600 hover:text-blue-800" @click="router.back()">← Back</button>

        <div class="mx-auto max-w-2xl">
            <div class="rounded-lg bg-white p-6 shadow">
                <h1 class="mb-6 text-3xl font-bold text-gray-900">Profile</h1>

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

                    <div>
                        <label class="block text-sm font-medium text-gray-500">Permissions</label>
                        <!-- {{ groupPermissionsByResource }} -->
                        <div class="space-y-4 divide-gray-500/50 divide-y">
                            <div v-for="(perms, group) in groupPermissionsByResource" :key="group" class="p-3">
                                <!-- Group title -->
                                <h3 class="mb-2 text-sm font-normal text-gray-600">
                                    {{ group }}
                                </h3>

                                <!-- Pills -->
                                <div class="flex flex-wrap gap-1">
                                    <span
                                        v-for="perm in perms"
                                        :key="perm"
                                        class="mr-2 mb-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                                    >
                                        {{ perm }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p class="mt-1" v-if="0">
                            <template v-if="!(permissions || []).length">
                                <span class="text-gray-500">No permissions assigned</span>
                            </template>
                            <template v-else>
                                <span
                                    v-for="(perm, index) in permissions"
                                    :key="perm"
                                    class="mr-2 mb-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                                >
                                    {{ perm }}
                                </span>
                            </template>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
