<script lang="ts">
    import { onMount } from "svelte";
    import { GetHost } from "./Host";

    let currentInstance = "N/A";

    onMount(async () => {
        const response = await fetch(`http://${GetHost()}/api/state`);
        const state = await response.json();
        currentInstance = state.invidious.selected_instance;
    })

</script>
<div>
    Current Instance: {currentInstance}
</div>
