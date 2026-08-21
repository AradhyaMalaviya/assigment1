<script lang="ts">
  import {
    LayoutDashboard,
    Mail,
    ServerCog,
    CalendarClock,
    ChartNoAxesCombined,
  } from 'lucide-svelte';
  import { page } from '$app/stores';
  export let open = false;
  export let onNavigate: (() => void) | undefined = undefined;
  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/send', label: 'Send campaign', icon: Mail },
    { href: '/configs', label: 'SMTP configurations', icon: ServerCog },
    { href: '/scheduled', label: 'Scheduled jobs', icon: CalendarClock },
    { href: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  ];
</script>

<aside class:open aria-label="Main navigation">
  <nav>
    {#each items as item (item.href)}<a
        href={item.href}
        aria-current={$page.url.pathname === item.href ? 'page' : undefined}
        on:click={onNavigate}
        ><svelte:component this={item.icon} size={18} /><span>{item.label}</span></a
      >{/each}
  </nav>
</aside>

<style>
  aside {
    position: fixed;
    z-index: 40;
    top: 3.75rem;
    bottom: 0;
    left: 0;
    width: 16rem;
    transform: translateX(-100%);
    border-right: 1px solid var(--color-border);
    background: var(--color-surface);
    padding: var(--space-3);
    transition: transform 160ms ease;
  }
  aside.open {
    transform: translateX(0);
  }
  nav {
    display: grid;
    gap: var(--space-1);
  }
  a {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    border-radius: var(--radius-md);
    color: var(--color-foreground);
    padding: 0.625rem var(--space-3);
    font-size: 0.875rem;
    text-decoration: none;
  }
  a:hover,
  a[aria-current='page'] {
    background: color-mix(in srgb, var(--color-primary) 11%, transparent);
    color: var(--color-primary-strong);
  }
  @media (min-width: 64rem) {
    aside {
      position: static;
      transform: none;
      min-height: calc(100vh - 3.75rem);
    }
  }
</style>
