<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte';
  import { Zap, Clock, Activity, Send, CheckCircle2, AlertTriangle, Info } from 'lucide-svelte';

  export let title: string;
  export let value: string | number;
  export let subtitle: string = '';
  export let icon: string = '';
  export let variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'default';
  export let badgeText: string = '';
  export let badgeVariant: 'success' | 'warning' | 'danger' | 'info' = 'info';
  export let loading: boolean = false;

  const variantBorderClasses: Record<string, string> = {
    default: 'border-slate-200 dark:border-slate-700/80',
    primary: 'border-blue-200 dark:border-blue-900/60',
    success: 'border-emerald-200 dark:border-emerald-900/60',
    warning: 'border-amber-200 dark:border-amber-900/60',
    danger: 'border-red-200 dark:border-red-900/60',
    info: 'border-indigo-200 dark:border-indigo-900/60'
  };

  const iconBgClasses: Record<string, string> = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    primary: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
  };
</script>

<div
  class="bg-white dark:bg-slate-800 rounded-xl p-5 border shadow-sm transition-all duration-200 hover:shadow-md relative overflow-hidden {variantBorderClasses[variant] || variantBorderClasses.default}"
>
  <div class="flex items-center justify-between gap-3">
    <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {title}
    </span>
    {#if icon}
      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors {iconBgClasses[variant] || iconBgClasses.default}">
        {#if icon === 'zap'}
          <Zap size={16} />
        {:else if icon === 'clock'}
          <Clock size={16} />
        {:else if icon === 'activity'}
          <Activity size={16} />
        {:else if icon === 'send'}
          <Send size={16} />
        {:else if icon === 'check-circle'}
          <CheckCircle2 size={16} />
        {:else if icon === 'alert-triangle'}
          <AlertTriangle size={16} />
        {:else}
          <Info size={16} />
        {/if}
      </div>
    {/if}
  </div>

  <div class="mt-2 flex items-baseline justify-between gap-2">
    {#if loading}
      <div class="h-8 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
    {:else}
      <span class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
        {value}
      </span>
    {/if}

    {#if badgeText}
      <Badge text={badgeText} variant={badgeVariant} />
    {/if}
  </div>

  {#if subtitle}
    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
      {subtitle}
    </p>
  {/if}
</div>
