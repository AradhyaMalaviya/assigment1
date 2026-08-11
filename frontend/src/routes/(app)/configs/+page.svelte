<script lang="ts">
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
</script>

<PageHeader
  title="SMTP configurations"
  description="Configuration management is implemented in Phase 5."
/><EmptyState
  title="Configuration scaffold ready"
  message="No SMTP settings are read or changed from this phase."
/>
