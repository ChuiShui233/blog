<script lang="ts">
    import { onMount } from "svelte";
    import I18nKey from "@i18n/i18nKey";
    import { i18n } from "@i18n/translation";
    import { getTotalPageViews, getTotalVisitors } from "@utils/umami-stats";

    let totalPageViews = 0;
    let totalVisitors = 0;
    let loading = true;
    let error = false;

    onMount(async () => {
        try {
            const [views, visitors] = await Promise.all([
                getTotalPageViews(),
                getTotalVisitors(),
            ]);
            totalPageViews = views;
            totalVisitors = visitors;
        } catch (err) {
            console.error("Failed to load total stats:", err);
            error = true;
        } finally {
            loading = false;
        }
    });
</script>

<div class="total-stats card-base pb-4 onload-animation" style="animation-delay: 250ms">
    <div class="font-bold transition text-lg text-neutral-900 dark:text-neutral-100 relative ml-8 mt-4 mb-2
        before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
        before:absolute before:left-[-16px] before:top-[5.5px]">{i18n(I18nKey.pageViews)}</div>
    <div class="px-4">
        {#if loading}
            <div class="text-center py-4 text-black/50 dark:text-white/50">加载中...</div>
        {:else if error}
            <div class="text-center py-4 text-black/50 dark:text-white/50">数据加载失败</div>
        {:else}
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-black/70 dark:text-white/70">总访问量</span>
                    <span class="text-xl font-bold text-[var(--primary)]">{totalPageViews.toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-black/70 dark:text-white/70">总访客数</span>
                    <span class="text-xl font-bold text-[var(--primary)]">{totalVisitors.toLocaleString()}</span>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .card-base {
        background: var(--card-bg);
        border-radius: var(--radius-large);
        box-shadow: var(--shadow);
        transition: all 0.3s ease;
    }
    .card-base:hover {
        box-shadow: var(--shadow-hover);
    }
</style>