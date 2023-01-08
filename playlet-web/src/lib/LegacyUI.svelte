<script lang="ts">
    import { getHost } from "./Host";

    const goToLegacyUI = async () => {
        window.location.href = `http://${getHost()}`
    };
</script>

<div>
    <button class="btn" on:click={goToLegacyUI}>Legacy UI</button>
</div>
