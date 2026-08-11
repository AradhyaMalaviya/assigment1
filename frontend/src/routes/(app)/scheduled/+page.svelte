<script lang="ts">
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
</script>

<PageHeader
  title="Scheduled jobs"
  description="Scheduled campaign controls are implemented in Phase 7."
/><EmptyState
  title="Scheduled jobs scaffold ready"
  message="No scheduler calls are made from this phase."
/>
