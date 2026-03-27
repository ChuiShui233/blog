<script lang="ts">
    import { onMount } from "svelte";
    import I18nKey from "@i18n/i18nKey";
    import { i18n } from "@i18n/translation";
    import { getPageViews } from "@utils/umami-stats";
    import { umamiStatsConfig } from "@/config";
    import Icon from "@iconify/svelte";

    export let path: string;

    let pageviews = 0;
    let loading = true;
    let error = false;

    onMount(async () => {
        if (!umamiStatsConfig.enabled) {
            loading = false;
            return;
        }
        try {
            pageviews = await getPageViews(path);
        } catch (err) {
            console.error("Failed to load pageviews:", err);
            error = true;
        } finally {
            loading = false;
        }
    });
</script>

{#if umamiStatsConfig.enabled}
    <div class="flex flex-row items-center">
        <div class="transition h-6 w-6 rounded-md bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/50 flex items-center justify-center mr-2">
            <Icon icon="material-symbols:visibility-outline-rounded" class="text-base" />
        </div>
        <div class="text-sm">
            {#if loading}
                --
            {:else if error}
                0
            {:else}
                {pageviews.toLocaleString()} {i18n(I18nKey.pageViews)}
            {/if}
        </div>
    </div>
{/if}