<script lang="ts">
  import { Plus } from 'lucide-svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import FileInput from '$lib/components/ui/FileInput.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import Navbar from '$lib/components/shared/Navbar.svelte';
  import { addToast } from '$lib/stores/toast';

  let modalOpen = false;
  let confirmOpen = false;
  let inputValue = '';
  let editorValue = '';
  let selectValue = 'standard';
  let checked = false;
  const tableColumns = [
    { key: 'campaign', label: 'Campaign', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'recipients', label: 'Recipients' },
  ];
  const tableRows = [
    { campaign: 'Monthly update', status: 'Ready', recipients: 120 },
    { campaign: 'Welcome series', status: 'Draft', recipients: 48 },
  ];
</script>

<svelte:head><title>UI Gallery | Bulk Email Sender</title></svelte:head>
<Navbar />
<main>
  <header>
    <div>
      <p class="eyebrow">Development-only</p>
      <h1>Component gallery</h1>
      <p>Reusable Phase 3 primitives in representative states.</p>
    </div>
  </header>
  <section class="grid">
    <Card
      ><svelte:fragment slot="header"><strong>Buttons</strong></svelte:fragment>
      <div class="row">
        <Button>Primary</Button><Button variant="secondary">Secondary</Button><Button
          variant="danger">Delete</Button
        ><Button variant="ghost">Ghost</Button><Button loading>Saving</Button><Button disabled
          >Disabled</Button
        >
      </div></Card
    >
    <Card
      ><svelte:fragment slot="header"><strong>Status badges</strong></svelte:fragment>
      <div class="row">
        <Badge variant="success" text="Sent" /><Badge variant="danger" text="Failed" /><Badge
          variant="warning"
          text="Error"
        />
      </div></Card
    >
    <Card
      ><svelte:fragment slot="header"><strong>Inputs</strong></svelte:fragment>
      <div class="stack">
        <Input
          id="gallery-campaign"
          label="Campaign name"
          hint="Used only for display."
          bind:value={inputValue}
          placeholder="August newsletter"
        /><Input
          id="gallery-invalid"
          label="Invalid example"
          error="A sender address is required."
          value=""
        /><Input id="gallery-disabled" label="Disabled input" disabled value="Read only" />
      </div></Card
    >
    <Card
      ><svelte:fragment slot="header"><strong>Selection controls</strong></svelte:fragment>
      <div class="stack">
        <Select
          id="gallery-mode"
          label="Campaign mode"
          bind:value={selectValue}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'batch', label: 'Batch' },
          ]}
        /><Checkbox
          id="gallery-notification"
          label="Send a browser notification"
          bind:checked
          hint="The preference can be changed later."
        />
      </div></Card
    >
    <Card
      ><svelte:fragment slot="header"><strong>File inputs</strong></svelte:fragment>
      <div class="stack">
        <FileInput label="No file selected" accept=".xlsx" /><FileInput
          label="Selected file example"
          selectedFileName="sample-contacts.xlsx"
        />
      </div></Card
    >
    <Card
      ><svelte:fragment slot="header"><strong>Feedback</strong></svelte:fragment>
      <div class="stack">
        <Alert variant="success" title="Success">Campaign draft saved.</Alert><Alert
          variant="warning"
          title="Review">Provider limits apply.</Alert
        ><Alert variant="danger" title="Error">A required field is missing.</Alert><Alert
          variant="info"
          title="Tip">Upload a contact spreadsheet to begin.</Alert
        ><Button
          variant="secondary"
          onClick={() =>
            addToast('This notification will dismiss automatically.', 'info', 'Toast queue')}
          >Add toast</Button
        >
      </div></Card
    >
    <Card
      ><svelte:fragment slot="header"><strong>Progress and loading</strong></svelte:fragment>
      <div class="stack">
        <ProgressBar value={20} /><ProgressBar value={72} /><ProgressBar value={100} />
        <div class="row"><Spinner size="sm" /><Spinner /><Spinner size="lg" /></div>
      </div></Card
    >
    <Card
      ><svelte:fragment slot="header"><strong>Dialogs</strong></svelte:fragment>
      <div class="row">
        <Button onClick={() => (modalOpen = true)}>Open modal</Button><Button
          variant="danger"
          onClick={() => (confirmOpen = true)}>Open confirmation</Button
        >
      </div></Card
    >
  </section>
  <section class="wide">
    <Card
      ><svelte:fragment slot="header"><strong>Responsive sortable table</strong></svelte:fragment
      ><Table
        columns={tableColumns}
        rows={tableRows}
        on:sort={(event) => addToast(`Sorted by ${event.detail.key}.`, 'info')}
      /></Card
    >
  </section>
  <section class="wide">
    <Card
      ><svelte:fragment slot="header"><strong>Rich text editor shell</strong></svelte:fragment
      ><RichTextEditor bind:value={editorValue} /></Card
    >
  </section>
  <section class="wide">
    <Card
      ><EmptyState
        title="No scheduled campaigns"
        message="Create a campaign to see it in this list."
        ><svelte:fragment slot="action"
          ><Button><Plus size={16} /> Create campaign</Button></svelte:fragment
        ></EmptyState
      ></Card
    >
  </section>
</main>
<Modal open={modalOpen} title="Reusable modal" onClose={() => (modalOpen = false)}
  ><p>
    Focus remains in this dialog. Press Escape or use the close button to return to the trigger.
  </p></Modal
>
<ConfirmDialog
  open={confirmOpen}
  title="Remove campaign?"
  message="This destructive action cannot be undone."
  confirmLabel="Remove"
  onCancel={() => (confirmOpen = false)}
  onConfirm={() => {
    confirmOpen = false;
    addToast('Campaign removed.', 'success');
  }}
/>

<style>
  main {
    max-width: 80rem;
    margin: 0 auto;
    padding: var(--space-4);
  }
  header {
    margin: var(--space-6) 0;
  }
  .eyebrow {
    margin: 0;
    color: var(--color-primary-strong);
    font-size: 0.75rem;
    font-weight: 750;
    text-transform: uppercase;
  }
  h1 {
    margin: var(--space-1) 0;
    font-size: 1.875rem;
  }
  header p:not(.eyebrow) {
    margin: 0;
    color: var(--color-muted);
  }
  .grid {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: 1fr;
  }
  .wide {
    margin-top: var(--space-4);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }
  .stack {
    display: grid;
    gap: var(--space-4);
  }
  @media (min-width: 48rem) {
    main {
      padding: var(--space-6);
    }
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
