<script lang="ts">
  import ChannelCastDialog from "./ChannelCastDialog.svelte";
  import ChannelThumbnail from "./ChannelThumbnail.svelte";

  export let author: string | undefined = undefined;
  export let authorId: string | undefined = undefined;
  export let authorThumbnails: any[] | undefined = undefined;
  export let channelHandle: string | undefined = undefined;
  export let subCount: number | undefined = undefined;

  // svelte-ignore unused-export-let
  export let type: string = undefined;

  let modal;
</script>

<button class="w-60 p-2" on:click={modal.show()}>
  <div class="card card-compact bg-base-100 shadow-xl border border-neutral">
    <ChannelThumbnail bind:author bind:authorThumbnails />
    <div class="card-body">
      <h3 class="card-title text-base line-clamp-1 min-h-8">{author}</h3>
      <div>{subCount} subscribers</div>
      <div>{channelHandle || ""}</div>
    </div>
  </div>
</button>
<ChannelCastDialog
  bind:this={modal}
  bind:author
  bind:authorId
  bind:authorThumbnails
/>
