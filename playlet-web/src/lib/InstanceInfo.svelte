<script lang="ts">
    import { PlayletApi } from "./PlayletApi";
    import { playletStateStore } from "./Stores";

    let currentInstance;
    let inputInstance;

    playletStateStore.subscribe((value) => {
        currentInstance = value?.invidious?.current_instance ?? "N/A";
        inputInstance = currentInstance;
    });

    const updateInstance = async () => {
        await PlayletApi.updateInstance(inputInstance);
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
        {#if inputInstance !== currentInstance}
            <button class="btn" on:click={updateInstance}>Update</button>
        {/if}
    </label>
</div>
