<script lang="ts">
  import { LogOut, Settings } from 'lucide-svelte';
  export let name = 'Account';
  export let email = '';
  export let onLogout: (() => void) | undefined = undefined;
</script>

<details>
  <summary>{name}</summary>
  <div class="menu">
    <p>{email}</p>
    <a href="/configs"><Settings size={16} /> SMTP configurations</a><button
      type="button"
      on:click={onLogout}><LogOut size={16} /> Sign out</button
    >
  </div>
</details>

<style>
  details {
    margin-left: auto;
    position: relative;
  }
  summary {
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 650;
  }
  .menu {
    position: absolute;
    right: 0;
    z-index: 10;
    width: 14rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
    padding: var(--space-2);
  }
  p {
    overflow: hidden;
    margin: var(--space-2);
    color: var(--color-muted);
    font-size: 0.75rem;
    text-overflow: ellipsis;
  }
  a,
  button {
    display: flex;
    width: 100%;
    align-items: center;
    gap: var(--space-2);
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-foreground);
    padding: var(--space-2);
    font-size: 0.875rem;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  a:hover,
  button:hover {
    background: var(--color-background);
  }
</style>
