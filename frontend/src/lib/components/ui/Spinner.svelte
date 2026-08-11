<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let block = false;
</script>

<span class:block-spinner={block} class="spinner spinner-{size}" role="status" aria-label="Loading">
  <span class="sr-only">Loading</span>
</span>

<style>
  .spinner {
    display: inline-block;
    border: 2px solid color-mix(in srgb, var(--color-primary) 22%, transparent);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .spinner-sm {
    width: 0.875rem;
    height: 0.875rem;
  }
  .spinner-md {
    width: 1.25rem;
    height: 1.25rem;
  }
  .spinner-lg {
    width: 2rem;
    height: 2rem;
    border-width: 3px;
  }
  .block-spinner {
    display: block;
    margin: var(--space-6) auto;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
