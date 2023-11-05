<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore } from "lib/Stores";
  import ChannelThumbnail from "./ChannelThumbnail.svelte";

  export let author: string | undefined = undefined;
  export let authorId: string | undefined = undefined;
  export let authorThumbnails: any[] | undefined = undefined;

  export function show() {
    modal.showModal();
  }

  export function close() {
    modal.close();
  }

  let modal;
  let tvName = "Roku TV";
  let invidiousInstance;

  playletStateStore.subscribe((value) => {
    tvName = value?.device?.friendly_name ?? "Roku TV";
    invidiousInstance = value?.invidious?.current_instance;
  });

  async function openOnTv() {
    await PlayletApi.openChannel(authorId);
  }

  function openInvidious() {
    let url = `${invidiousInstance}/channel/${authorId}`;
    window.open(url);
  }
</script>

<dialog bind:this={modal} class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    <div class="flex flex-col items-center">
      {#if authorThumbnails}
        <div class="w-32">
          <ChannelThumbnail bind:author bind:authorThumbnails />
        </div>
      {/if}
      <div class="m-4">{author}</div>
    </div>
    <div class="flex flex-col">
      <div class="join join-vertical m-2">
        <button class="btn join-item hover:btn-accent" on:click={openOnTv}>
          Open on {tvName}
        </button>
        <button class="btn join-item hover:btn-accent" on:click={openInvidious}>
          Open in Invidious
        </button>
        <button class="btn join-item hover:btn-accent">Cancel</button>
      </div>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>Close</button>
  </form>
</dialog>
