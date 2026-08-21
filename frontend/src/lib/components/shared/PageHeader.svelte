<script lang="ts">
  export let title = '';
  export let description: string | undefined = undefined;
</script>

<header class="page-header">
  <div>
    <h1>{title}</h1>
    {#if description}<p>{description}</p>{/if}
  </div>
  <slot />
</header>

<style>
  .page-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }
  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  p {
    margin: var(--space-1) 0 0;
    color: var(--color-muted);
    line-height: 1.5;
  }
</style>
