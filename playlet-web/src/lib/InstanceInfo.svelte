<script lang="ts">
    import { PlayletApi } from "./PlayletApi";
    import { playletStateStore } from "./Stores";

    let selectedInstance;
    let inputInstance;

    playletStateStore.subscribe((value) => {
        selectedInstance = value?.invidious?.selected_instance ?? "N/A";
        inputInstance = selectedInstance;
    });

    const updateInstance = async () => {
        await PlayletApi.updateInstances([inputInstance]);
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
            bind:value={inputInstance}
        />
        {#if inputInstance !== selectedInstance}
            <button class="btn" on:click={updateInstance}>Update</button>
        {/if}
    </label>
</div>
