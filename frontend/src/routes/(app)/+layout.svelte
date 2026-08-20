<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { logout } from '$lib/api/auth';
  import Navbar from '$lib/components/shared/Navbar.svelte';
  import Sidebar from '$lib/components/shared/Sidebar.svelte';
  import UserMenu from '$lib/components/shared/UserMenu.svelte';
  import { setAuthUser } from '$lib/stores/auth';
  import { addToast } from '$lib/stores/toast';
  import type { LayoutData } from './$types';

  // Guaranteed non-null: this layout only renders once the server guard has already
  // redirected unauthenticated visitors away.
  export let data: LayoutData;

  let sidebarOpen = false;
  let loggingOut = false;
  const closeSidebar = () => {
    sidebarOpen = false;
  };

  // Browser-only mirror of the server-resolved session. `authUser` is a module-scope
  // writable, and under Node SSR that scope is shared across concurrent requests — so it
  // must never be written from server code, only from here or from lib/api/auth.ts.
  $: if (browser) setAuthUser(data.user);

  async function handleLogout() {
    if (loggingOut) return;
    loggingOut = true;
    try {
      await logout();
    } finally {
      loggingOut = false;
    }
    addToast('Signed out', 'success');
    // invalidateAll clears SvelteKit's load cache before navigating. Cookies are not a
    // tracked load dependency, so without it nothing tells SvelteKit that this layout's
    // already-resolved { user } is stale — and back-navigation could redisplay the
    // protected shell from cache instead of re-running the guard.
    await goto('/login', { invalidateAll: true });
  }
</script>

<a href="#main-content" class="skip-to-content">Skip to main content</a>

<Navbar onMenuToggle={() => (sidebarOpen = !sidebarOpen)}>
  <UserMenu name={data.user.name} email={data.user.email} onLogout={handleLogout} />
</Navbar>
<div class="app-shell">
  <Sidebar open={sidebarOpen} onNavigate={closeSidebar} />
  <main id="main-content" tabindex="-1"><slot /></main>
</div>

<style>
  .app-shell {
    display: flex;
    min-height: calc(100vh - 3.75rem);
  }
  main {
    width: 100%;
    min-width: 0;
    padding: var(--space-4);
  }
  @media (min-width: 48rem) {
    main {
      padding: var(--space-6);
    }
  }
</style>
