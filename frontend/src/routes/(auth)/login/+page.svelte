<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { login } from '$lib/api/auth';
  import { ApiError } from '$lib/api/client';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { resolveRedirectTarget } from '$lib/utils/redirect';
  import { validateLoginForm } from '$lib/utils/validation';

  let email = '';
  let password = '';
  let submitting = false;
  let errorMessage = '';

  $: redirectTo = $page.url.searchParams.get('redirectTo');
  // Carry the original destination across the form switch so a visitor who registers
  // instead still lands where they were originally headed.
  $: registerHref = redirectTo
    ? `/register?redirectTo=${encodeURIComponent(redirectTo)}`
    : '/register';

  async function handleSubmit() {
    errorMessage = '';
    // Mirrors the backend's presence-only login check, so an empty field costs no round trip.
    const validationError = validateLoginForm({ email, password });
    if (validationError) {
      errorMessage = validationError;
      return;
    }

    submitting = true;
    try {
      await login({ email, password });
      // Left submitting on success: the button stays busy through navigation rather
      // than flashing enabled while the next route loads.
      await goto(resolveRedirectTarget(redirectTo));
    } catch (err) {
      // The backend's own message is the most accurate thing to show, so it is rendered
      // verbatim ("Invalid email or password").
      errorMessage =
        err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.';
      submitting = false;
    }
  }
</script>

<svelte:head><title>Sign in | Bulk Email Sender</title></svelte:head>

<section class="card">
  <h1>Sign in</h1>
  <p class="subtitle">Access your bulk email workspace.</p>

  {#if errorMessage}
    <div class="alert-slot"><Alert variant="danger">{errorMessage}</Alert></div>
  {/if}

  <!-- novalidate: our own validation owns the messaging, so failures render in the
       Alert above instead of as inconsistent native browser bubbles. -->
  <form on:submit|preventDefault={handleSubmit} novalidate>
    <Input
      label="Email"
      type="email"
      name="email"
      placeholder="you@example.com"
      bind:value={email}
      disabled={submitting}
      required
    />
    <Input
      label="Password"
      type="password"
      name="password"
      bind:value={password}
      disabled={submitting}
      required
    />
    <Button type="submit" loading={submitting}>Sign in</Button>
  </form>

  <p class="switch">Don't have an account? <a href={registerHref}>Create one</a></p>
</section>

<style>
  .card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
  }
  h1 {
    margin-top: 0;
    margin-bottom: var(--space-1);
  }
  .subtitle {
    margin-top: 0;
    color: var(--color-muted);
    font-size: 0.875rem;
  }
  .alert-slot {
    margin-bottom: var(--space-4);
  }
  form {
    display: grid;
    gap: var(--space-4);
  }
  .switch {
    margin-bottom: 0;
    color: var(--color-muted);
    font-size: 0.875rem;
    text-align: center;
  }
  .switch a {
    color: var(--color-primary-strong);
    font-weight: 650;
  }
</style>
