<script lang="ts">
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { triggerDownload } from "lib/Utils/Download";
  import VideoListRow from "lib/VideoFeed/VideoListRow.svelte";
  import { bookmarksStore, translate } from "lib/Stores";

  export let visibility: boolean;

  let fileInput: HTMLInputElement;

  async function exportBookmarks() {
    try {
      const content = await PlayletApi.getBookmarks();
      triggerDownload("playlet-bookmarks.json", content, "application/json");
    } catch (error) {
      console.error(error);
      alert($translate("Failed to export bookmarks."));
    }
  }

  function validateBookmarks(data: any): string | null {
    if (typeof data !== "object" || data === null) {
      return $translate("Invalid bookmarks file: not a JSON object.");
    }
    if (!("__version" in data)) {
      return $translate("Invalid bookmarks file: missing version field.");
    }
    if (!Array.isArray(data.groups)) {
      return $translate("Invalid bookmarks file: missing groups.");
    }
    const totalBookmarks = data.groups.reduce(
      (sum: number, g: any) => sum + (Array.isArray(g.bookmarks) ? g.bookmarks.length : 0), 0
    );
    if (totalBookmarks === 0) {
      return $translate("Invalid bookmarks file: no bookmarks found.");
    }
    return null;
  }

  async function importBookmarks() {
    fileInput.click();
  }

  async function handleFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      const error = validateBookmarks(parsed);
      if (error) {
        alert(error);
        return;
      }
      if (!confirm($translate("This will replace all existing bookmarks. Continue?"))) {
        return;
      }
      await PlayletApi.setBookmarks(content);
      alert($translate("Bookmarks imported. Restart the app to see the changes."));
    } catch (error) {
      console.error(error);
      alert($translate("Failed to import bookmarks. Make sure the file is valid JSON."));
    }
    input.value = "";
  }


</script>

<div class={visibility ? "" : "hidden"}>
  <div class="flex justify-end gap-2 px-4 pt-2">
    <button class="btn btn-outline btn-sm" on:click={exportBookmarks}>
      {$translate("Export bookmarks")}
    </button>
    <button class="btn btn-outline btn-sm" on:click={importBookmarks}>
      {$translate("Import bookmarks")}
    </button>
    <input
      type="file"
      accept=".json"
      class="hidden"
      bind:this={fileInput}
      on:change={handleFileSelected}
    />
  </div>

  {#if $bookmarksStore.length === 0}
    <div
      class="flex flex-col items-center justify-start h-screen w-2/3 mx-auto"
    >
      <div class="text-2xl font-bold text-gray-500">
        {$translate("No Bookmarks")}
      </div>
      <div class="text-gray-500 text-center">
        {$translate("You currently have no bookmarks.")}<br />
        {$translate(
          "To add bookmarks, select a video, playlist or channel, and add a bookmark."
        )}<br />
        {$translate("Please note that Bookmarks is an experimental feature.")}
      </div>
    </div>
  {:else}
    {#each $bookmarksStore as feed}
      <VideoListRow {feed} />
    {/each}
  {/if}
</div>
