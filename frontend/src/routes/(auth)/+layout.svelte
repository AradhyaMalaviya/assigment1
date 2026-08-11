<main class="auth-shell"><section><slot /></section></main>

<style>
  .auth-shell {
    display: grid;
    min-height: 100vh;
    place-items: center;
    padding: var(--space-4);
  }
  section {
    width: min(100%, 28rem);
  }
</style>
