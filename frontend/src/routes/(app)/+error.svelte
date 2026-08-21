<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Workspace Error | Bulk Email Sender</title>
</svelte:head>

<section>
  <h1>Unable to load this workspace</h1>
  <p>{$page.error?.message ?? 'Please try again.'}</p>
  <a href="/dashboard">Return to dashboard</a>
</section>

<style>
  section {
    max-width: 38rem;
    padding: var(--space-6);
  }
  h1 {
    margin-top: 0;
  }
  p {
    color: var(--color-muted);
  }
  a {
    color: var(--color-primary-strong);
  }
</style>
