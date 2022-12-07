<script lang="ts">
    import { playletStateStore } from "./Stores";

    let currentInstance;

	playletStateStore.subscribe(value => {
        currentInstance = value?.invidious?.selected_instance ?? "N/A";
	});
</script>
<div>
    Current Instance: {currentInstance}
</div>
