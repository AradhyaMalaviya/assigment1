<script lang="ts">
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
</script>

<PageHeader
  title="Send campaign"
  description="Campaign composition and multipart upload are implemented in Phase 6."
/><EmptyState
  title="Campaign composer scaffold ready"
  message="No email is sent from this phase."
/>
