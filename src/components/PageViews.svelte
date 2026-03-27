<script lang="ts">
    import { onMount } from "svelte";
    import I18nKey from "@i18n/i18nKey";
    import { i18n } from "@i18n/translation";
    import { getPageViews } from "@utils/umami-stats";
    import Icon from "@iconify/svelte";

    export let path: string;
    export let showLabel = true;

    let pageviews = 0;
    let loading = true;
    let error = false;

    onMount(async () => {
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

<div class="flex items-center">
    <div class="meta-icon">
        <Icon icon="material-symbols:visibility-outline-rounded" class="text-xl" />
    </div>
    <span class="text-50 text-sm font-medium">
        {#if showLabel}{i18n(I18nKey.pageViews)}: {/if}
        {#if loading}
            <span class="pageviews-number">--</span>
        {:else if error}
            <span class="pageviews-number">0</span>
        {:else}
            <span class="pageviews-number">{pageviews.toLocaleString()}</span>
        {/if}
    </span>
</div>

