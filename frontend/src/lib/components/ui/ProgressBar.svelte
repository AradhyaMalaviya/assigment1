<script lang="ts">
  export let value = 0;
  export let max = 100;
  export let label = 'Progress';
  $: percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
</script>

<div class="progress-wrap">
  <div
    class="progress"
    role="progressbar"
    aria-label={label}
    aria-valuemin="0"
    aria-valuemax={max}
    aria-valuenow={Math.min(value, max)}
  >
    <div class="bar" style={`width: ${percentage}%`}></div>
  </div>
  <span>{Math.round(percentage)}%</span>
</div>

<style>
  .progress-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .progress {
    height: 0.625rem;
    flex: 1;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-primary) 13%, white);
  }
  .bar {
    height: 100%;
    border-radius: inherit;
    background: var(--color-primary);
    transition: width 180ms ease;
  }
  span {
    min-width: 3ch;
    color: var(--color-muted);
    font-size: 0.8125rem;
    text-align: right;
  }
</style>
