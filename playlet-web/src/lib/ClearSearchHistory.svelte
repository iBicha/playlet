<script lang="ts">
    import { PlayletApi } from "./PlayletApi";

    const clearSearchHistory = async () => {
        await PlayletApi.clearSearchHistory();
    };
</script>

<div>
    <button class="btn" on:click={clearSearchHistory}>Clear search history</button>
</div>
