<script lang="ts">
  import { Menu } from 'lucide-svelte';
  export let onMenuToggle: (() => void) | undefined = undefined;
</script>

<header class="navbar">
  <button
    type="button"
    class="menu"
    on:click={onMenuToggle}
    aria-label="Toggle navigation"
    title="Toggle navigation"><Menu size={20} /></button
  ><a href="/dashboard" class="brand">Bulk Email Sender</a><slot />
</header>

<style>
  .navbar {
    display: flex;
    min-height: 3.75rem;
    align-items: center;
    gap: var(--space-3);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    padding: 0 var(--space-4);
  }
  .brand {
    color: var(--color-foreground);
    font-weight: 750;
    text-decoration: none;
  }
  .menu {
    display: grid;
    place-items: center;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-foreground);
    cursor: pointer;
  }
  @media (min-width: 64rem) {
    .menu {
      display: none;
    }
  }
</style>
