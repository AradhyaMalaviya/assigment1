<script lang="ts">
  import { Inbox } from 'lucide-svelte';
  export let title = 'Nothing here yet';
  export let message = '';
</script>

<section class="empty">
  <Inbox size={32} aria-hidden="true" />
  <div>
    <h2>{title}</h2>
    {#if message}<p>{message}</p>{/if}
  </div>
  {#if $$slots.action}<div class="action"><slot name="action" /></div>{/if}
</section>

<style>
  .empty {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding: var(--space-8) var(--space-4);
    color: var(--color-muted);
    text-align: center;
  }
  h2 {
    margin: 0;
    color: var(--color-foreground);
    font-size: 1rem;
  }
  p {
    margin: var(--space-1) 0 0;
    max-width: 34rem;
    line-height: 1.5;
  }
  .action {
    margin-top: var(--space-2);
  }
</style>
