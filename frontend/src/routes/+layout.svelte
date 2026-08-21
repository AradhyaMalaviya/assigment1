<script lang="ts">
  import '../app.css';
  import ToastHost from '$lib/components/ui/ToastHost.svelte';
  import { dismissToast, toasts } from '$lib/stores/toast';
</script>

<slot />
<ToastHost toasts={$toasts} onDismiss={dismissToast} />
