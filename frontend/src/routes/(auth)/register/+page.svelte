<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { register } from '$lib/api/auth';
  import { ApiError } from '$lib/api/client';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { resolveRedirectTarget } from '$lib/utils/redirect';
  import { MIN_PASSWORD_LENGTH, validateRegisterForm } from '$lib/utils/validation';

  let name = '';
  let email = '';
  let password = '';
  let submitting = false;
  let errorMessage = '';

  $: redirectTo = $page.url.searchParams.get('redirectTo');
  $: loginHref = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login';

  async function handleSubmit() {
    errorMessage = '';
    // Mirrors the backend's stricter register rules — presence, length, then format, in
    // that order — so the client and server agree on which message a bad input earns.
    const validationError = validateRegisterForm({ name, email, password });
    if (validationError) {
      errorMessage = validationError;
      return;
    }

    submitting = true;
    try {
      // The backend sets the session cookie on register, and register() populates the
      // auth store, so there is no follow-up login call: auto-login is true by construction.
      await register({ name, email, password });
      await goto(resolveRedirectTarget(redirectTo));
    } catch (err) {
      // Rendered verbatim, e.g. "An account with this email already exists".
      errorMessage =
        err instanceof ApiError ? err.message : 'Unable to create your account. Please try again.';
      submitting = false;
    }
  }
</script>

<svelte:head><title>Register | Bulk Email Sender</title></svelte:head>

<section class="card">
  <h1>Create account</h1>
  <p class="subtitle">Set up your bulk email workspace.</p>

  {#if errorMessage}
    <div class="alert-slot"><Alert variant="danger">{errorMessage}</Alert></div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} novalidate>
    <Input
      label="Name"
      name="name"
      placeholder="Ada Lovelace"
      bind:value={name}
      disabled={submitting}
      required
    />
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
      hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      bind:value={password}
      disabled={submitting}
      required
    />
    <Button type="submit" loading={submitting}>Create account</Button>
  </form>

  <p class="switch">Already have an account? <a href={loginHref}>Sign in</a></p>
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
