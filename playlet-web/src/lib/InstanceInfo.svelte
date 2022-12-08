<script lang="ts">
    import { PlayletApi } from "./PlayletApi";
    import { playletStateStore } from "./Stores";

    let selectedInstance;
    let currentInstance;

    playletStateStore.subscribe((value) => {
        selectedInstance = value?.invidious?.selected_instance ?? "N/A";
        currentInstance = selectedInstance;
    });

    const updateInstance = async () => {
        await PlayletApi.updateInstances([currentInstance]);
        // TODO: reload state
        window.location.reload();
    };
</script>

<div class="form-control">
    <label class="input-group">
        <span>Invidious Instance</span>
        <input
            type="text"
            placeholder="http://my-instance.com"
            class="input input-bordered"
            bind:value={currentInstance}
        />
        {#if currentInstance !== selectedInstance}
            <button class="btn" on:click={updateInstance}>Update</button>
        {/if}
    </label>
</div>
