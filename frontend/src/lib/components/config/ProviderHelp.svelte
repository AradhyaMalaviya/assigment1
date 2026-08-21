<script lang="ts">
  import Alert from '$lib/components/ui/Alert.svelte';
  import { getProviderGuidance } from '$lib/utils/smtpPassword';
  export let host: string;
  export let mode: 'create' | 'edit';
  $: guidance = getProviderGuidance(host, mode);
</script>

{#if guidance}
  <Alert variant={guidance.tone} title={guidance.title}>
    <ul>{#each guidance.steps as step (step)}<li>{step}</li>{/each}</ul>
    {#if guidance.helpUrl}<a href={guidance.helpUrl} target="_blank" rel="noreferrer">Generate an App Password</a>{/if}
  </Alert>
{/if}

<style>
  ul {
    margin: 0;
    padding-left: var(--space-5);
  }
  li {
    margin-bottom: var(--space-1);
  }
  li:last-child {
    margin-bottom: 0;
  }
  a {
    display: inline-block;
    margin-top: var(--space-2);
    color: inherit;
    font-weight: 600;
  }
</style>
