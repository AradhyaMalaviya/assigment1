<script lang="ts">
  export let padding: 'none' | 'sm' | 'md' = 'md';
</script>

<section class="card" aria-label="Card">
  {#if $$slots.header}<header class="header"><slot name="header" /></header>{/if}
  <div class="body {padding}"><slot /></div>
  {#if $$slots.footer}<footer class="footer"><slot name="footer" /></footer>{/if}
</section>

<style>
  .card {
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
  }
  .header,
  .footer {
    padding: var(--space-4) var(--space-5);
    background: color-mix(in srgb, var(--color-background) 70%, var(--color-surface));
  }
  .header {
    border-bottom: 1px solid var(--color-border);
  }
  .footer {
    border-top: 1px solid var(--color-border);
  }
  .body.none {
    padding: 0;
  }
  .body.sm {
    padding: var(--space-3);
  }
  .body.md {
    padding: var(--space-5);
  }
</style>
