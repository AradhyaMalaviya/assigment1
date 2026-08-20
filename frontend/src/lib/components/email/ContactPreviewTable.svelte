<script lang="ts">
  import type { Contact } from '$lib/types/api';

  export let contacts: Contact[] = [];
  export let totalContactCount: number = 0;

  $: columns = deriveColumns(contacts);

  function deriveColumns(list: Contact[]): string[] {
    if (!list || list.length === 0) return [];
    const keys: string[] = [];
    list.forEach((c) => {
      Object.keys(c).forEach((k) => {
        if (!keys.includes(k)) {
          keys.push(k);
        }
      });
    });
    // Put Email first if present
    const emailIndex = keys.findIndex((k) => k.toLowerCase() === 'email');
    if (emailIndex > -1) {
      const [emailCol] = keys.splice(emailIndex, 1);
      keys.unshift(emailCol);
    }
    return keys;
  }
</script>

{#if contacts && contacts.length > 0}
  <div class="contact-preview-container">
    <div class="preview-header">
      <span class="preview-title">
        Previewing first {contacts.length} of {totalContactCount} contact{totalContactCount === 1 ? '' : 's'}
      </span>
      <span class="preview-badge">Server Parsed</span>
    </div>

    <div class="table-wrapper">
      <table class="preview-table">
        <thead>
          <tr>
            {#each columns as col (col)}
              <th scope="col">{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each contacts as contact, idx (contact.Email || idx)}
            <tr>
              {#each columns as col (col)}
                <td>
                  {#if col.toLowerCase() === 'email'}
                    <span class="email-cell">{String(contact[col] ?? '')}</span>
                  {:else}
                    {String(contact[col] ?? '')}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

<style>
  .contact-preview-container {
    display: grid;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8125rem;
  }
  .preview-title {
    font-weight: 600;
    color: #475569;
  }
  .preview-badge {
    background: #e0e7ff;
    color: #3730a3;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
  }
  .table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-md, 0.375rem);
    background: var(--color-surface, #ffffff);
  }
  .preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84375rem;
    text-align: left;
  }
  .preview-table th {
    background: #f8fafc;
    color: #334155;
    font-weight: 650;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .preview-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    white-space: nowrap;
  }
  .preview-table tr:last-child td {
    border-bottom: none;
  }
  .email-cell {
    font-weight: 600;
    color: var(--color-primary, #4f46e5);
  }
</style>
