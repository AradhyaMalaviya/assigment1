import { derived, writable } from 'svelte/store';
import type { User } from '$lib/types/api';

export const authUser = writable<User | null>(null);
export const isAuthenticated = derived(authUser, (user) => user !== null);
export const setAuthUser = (user: User | null) => authUser.set(user);
export const clearAuth = () => authUser.set(null);
