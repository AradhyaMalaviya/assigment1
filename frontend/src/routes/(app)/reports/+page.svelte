<script lang="ts">
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
</script>

<PageHeader
  title="Reports"
  description="Delivery logs and exports are implemented in Phase 9."
/><EmptyState
  title="Reports scaffold ready"
  message="No report data is requested from this phase."
/>
