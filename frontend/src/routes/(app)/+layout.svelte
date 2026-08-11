<script lang="ts">
  import Navbar from '$lib/components/shared/Navbar.svelte';
  import Sidebar from '$lib/components/shared/Sidebar.svelte';
  import UserMenu from '$lib/components/shared/UserMenu.svelte';
  let sidebarOpen = false;
  const closeSidebar = () => {
    sidebarOpen = false;
  };
</script>

<Navbar onMenuToggle={() => (sidebarOpen = !sidebarOpen)}><UserMenu /></Navbar>
<div class="app-shell">
  <Sidebar open={sidebarOpen} onNavigate={closeSidebar} />
  <main><slot /></main>
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
