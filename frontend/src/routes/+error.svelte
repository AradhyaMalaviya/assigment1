<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Error {$page.status} | Bulk Email Sender</title>
</svelte:head>

<main>
  <h1>{$page.status}</h1>
  <p>{$page.error?.message ?? 'The requested page could not be loaded.'}</p>
  <a href="/dashboard">Return to dashboard</a>
</main>

<style>
  main {
    display: grid;
    place-content: center;
    min-height: 100vh;
    padding: var(--space-6);
    text-align: center;
  }
  h1 {
    margin: 0;
    font-size: 3rem;
  }
  p {
    color: var(--color-muted);
  }
  a {
    color: var(--color-primary-strong);
  }
</style>
