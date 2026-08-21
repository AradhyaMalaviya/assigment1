<script lang="ts">
  export let compact: boolean = false;
</script>

<div class="placeholder-help" class:compact>
  <div class="help-header">
    <span class="help-title">💡 Supported Dynamic Placeholders</span>
  </div>
  <p class="help-description">
    Use placeholders in your subject or email content. They will be automatically replaced for each contact during campaign sending.
  </p>

  <div class="placeholder-chips">
    <code class="chip">{"{{FirstName}}"}</code>
    <code class="chip">{"{{LastName}}"}</code>
    <code class="chip">{"{{Company}}"}</code>
    <code class="chip">{"{{Email}}"}</code>
    <code class="chip">{"{{Subject}}"}</code>
    <span class="chip-note">+ any custom spreadsheet column name e.g. <code>{"{{CustomCol}}"}</code></span>
  </div>
</div>

<style>
  .placeholder-help {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.75rem;
    font-size: 0.8125rem;
    display: grid;
    gap: 0.375rem;
  }
  .placeholder-help.compact {
    padding: 0.5rem 0.625rem;
  }
  .help-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .help-title {
    font-weight: 650;
    color: #334155;
  }
  .help-description {
    color: #64748b;
    margin: 0;
    line-height: 1.4;
  }
  .placeholder-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.25rem;
  }
  .chip {
    background: #e0e7ff;
    color: #3730a3;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .chip-note {
    font-size: 0.75rem;
    color: #64748b;
  }
</style>
