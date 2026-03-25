<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { useUsers } from '@/composables/useUsers';
import { useToast } from '@/composables/useToast';
import type { User } from '@/types';
import type { UserDetail, UserOptions } from '@/composables/useUsers';

const toast = useToast();
const { users, loading, fetchUsers, fetchUser, updateUser, updateUserRole, updateUserPermissions, fetchOptions } =
    useUsers();

// ─── Pagination & Search ─────────────────────────────────────────────────────

const search = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const searchTimer = ref<ReturnType<typeof setTimeout> | null>(null);

async function loadUsers(page = 1): Promise<void> {
    const params: Record<string, unknown> = { page };

    if (search.value.trim()) {
        params.search = search.value.trim();
    }

    const response = await fetchUsers(params);

    currentPage.value = response.current_page;
    totalPages.value = response.last_page;
}

watch(search, () => {
    if (searchTimer.value) {
        clearTimeout(searchTimer.value);
    }

    searchTimer.value = setTimeout(() => {
        loadUsers(1);
    }, 350);
});

// ─── Available Options (roles + all permissions) ─────────────────────────────

const options = ref<UserOptions>({ roles: [], permissions: [] });

const permissionGroups = computed(() => {
    const groups: Record<string, string[]> = {};

    options.value.permissions.forEach((perm) => {
        const [namespace] = perm.split('.');

        if (!groups[namespace]) {
            groups[namespace] = [];
        }

        groups[namespace].push(perm);
    });

    return groups;
});

// ─── Modal State ─────────────────────────────────────────────────────────────

type ModalTab = 'info' | 'role' | 'permissions';

const showModal = ref(false);
const activeTab = ref<ModalTab>('info');
const selectedUserDetail = ref<UserDetail | null>(null);
const modalLoading = ref(false);

const infoForm = ref({ name: '', email: '' });
const infoErrors = ref<Record<string, string>>({});

const roleForm = ref('');

const selectedPermissions = ref<string[]>([]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleColor(role: string): string {
    const colors: Record<string, string> = {
        super_admin: 'bg-purple-100 text-purple-800',
        admin: 'bg-red-100 text-red-800',
        manager: 'bg-blue-100 text-blue-800',
        operator: 'bg-yellow-100 text-yellow-800',
        customer: 'bg-green-100 text-green-800',
    };

    return colors[role] ?? 'bg-gray-100 text-gray-700';
}

function isCurrentRole(role: string | null = null): boolean {
    if (!role) {
        return false;
    }

    if (!selectedUserDetail.value || !selectedUserDetail.value?.user) {
        return false;
    }

    let selectedUserRoles: any[] = (selectedUserDetail.value || {})?.user?.roles || [];

    if (!Array.isArray(selectedUserRoles) || !selectedUserRoles.length) {
        return false;
    }

    return selectedUserRoles[0]?.name === role;
}

function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        super_admin: 'Super Admin',
        admin: 'Admin',
        manager: 'Manager',
        operator: 'Operator',
        customer: 'Customer',
    };

    return labels[role] ?? role;
}

function getUserRole(user: User): string {
    const roles = (user as any).roles as Array<{ name: string }> | undefined;

    if (roles && roles.length > 0) {
        return roles[0].name;
    }

    return user.role ?? '-';
}

// ─── Modal Open / Close ───────────────────────────────────────────────────────

async function openModal(user: User): Promise<void> {
    showModal.value = true;
    activeTab.value = 'info';
    modalLoading.value = true;
    selectedUserDetail.value = null;
    infoErrors.value = {};

    try {
        const detail = await fetchUser(user.id);

        selectedUserDetail.value = detail;
        infoForm.value = { name: detail.user.name, email: detail.user.email };
        roleForm.value = getUserRole(detail.user);
        selectedPermissions.value = [...detail.direct_permissions];
    } catch {
        toast.error('Failed to load user details');
        showModal.value = false;
    } finally {
        modalLoading.value = false;
    }
}

function closeModal(): void {
    showModal.value = false;
    selectedUserDetail.value = null;
}

// ─── Save Info ────────────────────────────────────────────────────────────────

async function handleSaveInfo(): Promise<void> {
    if (!selectedUserDetail.value) {
        return;
    }

    infoErrors.value = {};

    if (!infoForm.value.name.trim()) {
        infoErrors.value.name = 'Name is required';

        return;
    }

    if (!infoForm.value.email.trim()) {
        infoErrors.value.email = 'Email is required';

        return;
    }

    modalLoading.value = true;

    try {
        const updated = await updateUser(selectedUserDetail.value.user.id, {
            name: infoForm.value.name.trim(),
            email: infoForm.value.email.trim(),
        });

        selectedUserDetail.value.user = updated;

        const userInList = users.value.find((u) => u.id === updated.id);

        if (userInList) {
            userInList.name = updated.name;
            userInList.email = updated.email;
        }

        toast.success('User updated successfully');
    } catch (e: any) {
        const errors = e?.response?.data?.errors;

        if (errors) {
            Object.keys(errors).forEach((field) => {
                infoErrors.value[field] = errors[field][0];
            });
        } else {
            toast.error('Failed to update user');
        }
    } finally {
        modalLoading.value = false;
    }
}

// ─── Save Role ────────────────────────────────────────────────────────────────

async function handleSaveRole(): Promise<void> {
    if (!selectedUserDetail.value || !roleForm.value) {
        return;
    }

    modalLoading.value = true;

    try {
        const updated = await updateUserRole(selectedUserDetail.value.user.id, roleForm.value);

        selectedUserDetail.value.user = updated;

        const userInList = users.value.find((u) => u.id === updated.id);

        if (userInList) {
            (userInList as any).roles = (updated as any).roles;
        }

        toast.success('Role updated successfully');
    } catch {
        toast.error('Failed to update role');
    } finally {
        modalLoading.value = false;
    }
}

// ─── Permissions Helpers ──────────────────────────────────────────────────────

function togglePermission(perm: string): void {
    const idx = selectedPermissions.value.indexOf(perm);

    if (idx >= 0) {
        selectedPermissions.value.splice(idx, 1);
    } else {
        selectedPermissions.value.push(perm);
    }
}

function toggleGroup(groupPermissions: string[]): void {
    const allSelected = groupPermissions.every((p) => selectedPermissions.value.includes(p));

    if (allSelected) {
        selectedPermissions.value = selectedPermissions.value.filter((p) => !groupPermissions.includes(p));
    } else {
        groupPermissions.forEach((p) => {
            if (!selectedPermissions.value.includes(p)) {
                selectedPermissions.value.push(p);
            }
        });
    }
}

function isGroupFullySelected(groupPermissions: string[]): boolean {
    return groupPermissions.every((p) => selectedPermissions.value.includes(p));
}

function isGroupPartiallySelected(groupPermissions: string[]): boolean {
    const someSelected = groupPermissions.some((p) => selectedPermissions.value.includes(p));

    return someSelected && !isGroupFullySelected(groupPermissions);
}

// ─── Save Permissions ─────────────────────────────────────────────────────────

async function handleSavePermissions(): Promise<void> {
    if (!selectedUserDetail.value) {
        return;
    }

    modalLoading.value = true;

    try {
        const updated = await updateUserPermissions(selectedUserDetail.value.user.id, selectedPermissions.value);

        selectedUserDetail.value.direct_permissions = updated;

        toast.success('Permissions updated successfully');
    } catch {
        toast.error('Failed to update permissions');
    } finally {
        modalLoading.value = false;
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
    await Promise.all([
        loadUsers(),
        fetchOptions().then((data) => {
            options.value = data;
        }),
    ]);
});
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <UIPageHeader title="Users" description="Manage system users, roles, and permissions.">
            <template v-slot:actions>
                <div class="relative">
                    <Icon icon="mdi:magnify" class="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search users..."
                        class="w-64 rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>
            </template>
        </UIPageHeader>

        <!-- Initial loading -->
        <div v-if="loading && users.length === 0" class="flex justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
        </div>

        <!-- Table -->
        <div v-else class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <!-- Reload bar -->
            <div v-if="loading" class="h-0.5 w-full bg-gray-100">
                <div class="h-full w-1/3 animate-pulse bg-red-500"></div>
            </div>

            <table class="w-full text-sm">
                <thead>
                    <tr
                        class="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                        <th class="px-5 py-3">User</th>
                        <th class="px-5 py-3">Role</th>
                        <th class="px-5 py-3">Client</th>
                        <th class="px-5 py-3">Member since</th>
                        <th class="px-5 py-3 text-right">Actions</th>
                    </tr>
                </thead>

                <tbody class="divide-y divide-gray-100">
                    <!-- Empty -->
                    <tr v-if="users.length === 0">
                        <td colspan="5" class="px-5 py-12 text-center text-gray-400">
                            <Icon icon="mdi:account-group-outline" class="mx-auto mb-2 text-4xl" />
                            <p>No users found</p>
                        </td>
                    </tr>

                    <tr v-for="user in users" :key="user.id" class="transition hover:bg-gray-50">
                        <!-- User -->
                        <td class="px-5 py-3.5">
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700"
                                >
                                    {{ user.name.charAt(0).toUpperCase() }}
                                </div>

                                <div>
                                    <p class="font-medium text-gray-900">{{ user.name }}</p>
                                    <p class="text-xs text-gray-500">{{ user.email }}</p>
                                </div>
                            </div>
                        </td>

                        <!-- Role -->
                        <td class="px-5 py-3.5">
                            <span
                                :class="[
                                    'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                    getRoleColor(getUserRole(user)),
                                ]"
                            >
                                {{ getRoleLabel(getUserRole(user)) }}
                            </span>
                        </td>

                        <!-- Client -->
                        <td class="px-5 py-3.5 text-gray-600">
                            {{ user.client?.name ?? '-' }}
                        </td>

                        <!-- Date -->
                        <td class="px-5 py-3.5 text-gray-500">
                            {{ user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-' }}
                        </td>

                        <!-- Actions -->
                        <td class="px-5 py-3.5 text-right">
                            <CButton
                                preset="outlined-black"
                                class="text-xs"
                                icon="mdi:pencil-outline"
                                @click="openModal(user)"
                            >
                                Edit
                            </CButton>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-gray-200 px-5 py-3">
                <p class="text-xs text-gray-500">Page {{ currentPage }} of {{ totalPages }}</p>

                <div class="flex gap-2">
                    <CButton
                        preset="outlined-black"
                        class="text-xs"
                        :disabled="currentPage <= 1"
                        icon="mdi:chevron-left"
                        @click="loadUsers(currentPage - 1)"
                    />

                    <CButton
                        preset="outlined-black"
                        class="text-xs"
                        :disabled="currentPage >= totalPages"
                        right-icon="mdi:chevron-right"
                        @click="loadUsers(currentPage + 1)"
                    />
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
        <div
            v-if="showModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            @click.self="closeModal"
        >
            <div class="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
                <!-- Modal Header -->
                <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700"
                        >
                            {{ selectedUserDetail?.user.name.charAt(0).toUpperCase() ?? '?' }}
                        </div>

                        <div>
                            <h2 class="text-base font-semibold text-gray-900">
                                {{ selectedUserDetail?.user.name ?? 'Loading...' }}
                            </h2>

                            <p class="text-xs text-gray-500">{{ selectedUserDetail?.user.email }}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        @click="closeModal"
                    >
                        <Icon icon="mdi:close" class="text-lg" />
                    </button>
                </div>

                <!-- Tabs -->
                <div class="flex shrink-0 border-b border-gray-200">
                    <button
                        v-for="tab in ['info', 'role', 'permissions'] as const"
                        :key="tab"
                        type="button"
                        :class="[
                            'px-6 py-3 text-sm font-medium transition-colors',
                            {
                                'border-b-2 border-red-600 text-red-600': activeTab === tab,
                                'text-gray-500 hover:text-gray-800': activeTab !== tab,
                            },
                        ]"
                        @click="activeTab = tab"
                    >
                        <span v-if="tab === 'info'">Basic Info</span>
                        <span v-else-if="tab === 'role'">Role</span>
                        <span v-else>Extra Permissions</span>
                    </button>
                </div>

                <!-- Loading initial detail -->
                <div v-if="modalLoading && !selectedUserDetail" class="flex items-center justify-center py-16">
                    <div class="h-7 w-7 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
                </div>

                <!-- Tab Content -->
                <div v-else class="overflow-y-auto p-6 max-h-[60vh]">
                    <!-- ── Basic Info ── -->
                    <form v-if="activeTab === 'info'" class="space-y-4" @submit.prevent="handleSaveInfo">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700">
                                Name
                                <span class="text-red-500">*</span>
                            </label>

                            <CInput
                                v-model="infoForm.name"
                                placeholder="Full name"
                                :class="{ 'border-red-500': infoErrors.name }"
                            />

                            <p v-if="infoErrors.name" class="mt-1 text-xs text-red-600">
                                {{ infoErrors.name }}
                            </p>
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700">
                                Email
                                <span class="text-red-500">*</span>
                            </label>

                            <CInput
                                v-model="infoForm.email"
                                type="email"
                                placeholder="user@example.com"
                                :class="{ 'border-red-500': infoErrors.email }"
                            />

                            <p v-if="infoErrors.email" class="mt-1 text-xs text-red-600">
                                {{ infoErrors.email }}
                            </p>
                        </div>

                        <div class="flex justify-end pt-2">
                            <CButton type="submit" preset="primary" :disabled="modalLoading" icon="mdi:check">
                                {{ modalLoading ? 'Saving...' : 'Save Changes' }}
                            </CButton>
                        </div>
                    </form>

                    <!-- ── Role ── -->
                    <div v-else-if="activeTab === 'role'" class="space-y-5">
                        <p class="text-sm text-gray-500">
                            Select the role for this user. The role defines the base set of permissions.
                        </p>

                        <div class="space-y-2">
                            <label
                                v-for="role in options.roles"
                                :key="role"
                                class="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition"
                                :class="[
                                    {
                                        'border-red-500 bg-red-50': roleForm === role,
                                        'border-gray-200 hover:border-gray-300 hover:bg-gray-50': roleForm !== role,
                                    },
                                ]"
                                @click="roleForm = role"
                            >
                                <!-- Radio indicator -->
                                <div
                                    :class="[
                                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                                        {
                                            'border-red-600 bg-red-600': roleForm === role,
                                            'border-gray-300': roleForm !== role,
                                        },
                                    ]"
                                >
                                    <div v-if="roleForm === role" class="h-2 w-2 rounded-full bg-white"></div>
                                </div>

                                <!-- Role badge -->
                                <span
                                    :class="[
                                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                        getRoleColor(role),
                                    ]"
                                >
                                    {{ getRoleLabel(role) }}
                                    <span v-if="isCurrentRole(role)" class="italic">(current role)</span>
                                </span>
                            </label>
                        </div>

                        <div class="flex justify-end">
                            <CButton preset="primary" :disabled="modalLoading" icon="mdi:check" @click="handleSaveRole">
                                {{ modalLoading ? 'Saving...' : 'Save Role' }}
                            </CButton>
                        </div>
                    </div>

                    <!-- ── Extra Permissions ── -->
                    <div v-else class="space-y-5">
                        <!-- Info banner -->
                        <div
                            class="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700"
                        >
                            <Icon icon="mdi:information-outline" class="mt-0.5 shrink-0 text-base" />

                            <p>
                                These are
                                <strong>direct permissions</strong>
                                assigned to the user, independent of their role. Permissions already granted via role
                                are shown in blue and cannot be unchecked here.
                            </p>
                        </div>

                        <div v-if="selectedUserDetail?.role_permissions.length" class="text-xs text-gray-500">
                            <strong>{{ selectedUserDetail.role_permissions.length }}</strong>
                            permissions already granted via role.
                        </div>

                        <!-- Permission groups -->
                        <div
                            v-for="(groupPerms, groupName) in permissionGroups"
                            :key="groupName"
                            class="overflow-hidden rounded-lg border border-gray-200"
                        >
                            <!-- Group header -->
                            <button
                                type="button"
                                class="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
                                @click="toggleGroup(groupPerms)"
                            >
                                <span class="text-sm font-semibold capitalize text-gray-800">
                                    {{ String(groupName).replace('_', ' ') }}
                                </span>

                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-gray-400">
                                        {{ groupPerms.filter((p) => selectedPermissions.includes(p)).length }}/{{
                                            groupPerms.length
                                        }}
                                    </span>

                                    <div
                                        :class="[
                                            'flex h-5 w-5 items-center justify-center rounded border-2',
                                            {
                                                'border-red-600 bg-red-600': isGroupFullySelected(groupPerms),
                                                'border-red-300 bg-red-50': isGroupPartiallySelected(groupPerms),
                                                'border-gray-300':
                                                    !isGroupFullySelected(groupPerms) &&
                                                    !isGroupPartiallySelected(groupPerms),
                                            },
                                        ]"
                                    >
                                        <Icon
                                            v-if="isGroupFullySelected(groupPerms)"
                                            icon="mdi:check"
                                            class="text-xs text-white"
                                        />

                                        <Icon
                                            v-else-if="isGroupPartiallySelected(groupPerms)"
                                            icon="mdi:minus"
                                            class="text-xs text-red-500"
                                        />
                                    </div>
                                </div>
                            </button>

                            <!-- Permissions list -->
                            <div class="divide-y divide-gray-100">
                                <div
                                    v-for="perm in groupPerms"
                                    :key="perm"
                                    class="flex items-center gap-3 px-4 py-2.5"
                                    :class="[
                                        {
                                            'cursor-pointer hover:bg-gray-50':
                                                !selectedUserDetail?.role_permissions.includes(perm),
                                            'opacity-70': selectedUserDetail?.role_permissions.includes(perm),
                                        },
                                    ]"
                                    @click="
                                        !selectedUserDetail?.role_permissions.includes(perm) && togglePermission(perm)
                                    "
                                >
                                    <!-- Via role (read-only, blue) -->
                                    <div
                                        v-if="selectedUserDetail?.role_permissions.includes(perm)"
                                        class="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-blue-400 bg-blue-100"
                                    >
                                        <Icon icon="mdi:check" class="text-[10px] text-blue-600" />
                                    </div>

                                    <!-- Direct permission (toggleable, red) -->
                                    <div
                                        v-else
                                        :class="[
                                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2',
                                            {
                                                'border-red-600 bg-red-600': selectedPermissions.includes(perm),
                                                'border-gray-300': !selectedPermissions.includes(perm),
                                            },
                                        ]"
                                    >
                                        <Icon
                                            v-if="selectedPermissions.includes(perm)"
                                            icon="mdi:check"
                                            class="text-[10px] text-white"
                                        />
                                    </div>

                                    <span
                                        :class="[
                                            'text-sm',
                                            {
                                                'text-gray-400': selectedUserDetail?.role_permissions.includes(perm),
                                                'text-gray-700': !selectedUserDetail?.role_permissions.includes(perm),
                                            },
                                        ]"
                                    >
                                        {{ perm }}
                                    </span>

                                    <span
                                        v-if="selectedUserDetail?.role_permissions.includes(perm)"
                                        class="ml-auto text-xs text-blue-500"
                                    >
                                        via role
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center justify-between pt-2">
                            <p class="text-xs text-gray-500">
                                {{ selectedPermissions.length }} extra permission(s) selected
                            </p>

                            <CButton
                                preset="primary"
                                :disabled="modalLoading"
                                icon="mdi:check"
                                @click="handleSavePermissions"
                            >
                                {{ modalLoading ? 'Saving...' : 'Save Permissions' }}
                            </CButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
