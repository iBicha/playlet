<script>
  import { onMount } from "svelte";
  import { PlayletApi } from "./PlayletApi";

  let selectedRelease = ''
  let releases = [];
  onMount(async () => {
    releases = await fetchReleaseTags();
  });

  async function fetchReleaseTags() {
    const response = await fetch(
      "https://api.github.com/repos/iBicha/playlet/releases"
    );
    const releases = await response.json();
    return releases.map((release) => {
      return {
        name: release.tag_name,
        enabled:
          release.assets.filter((asset) => asset.name === "playlet-lib.zip")
            .length > 0,
      };
    });
  }

  async function apply() {
    await PlayletApi.setPlayletLibVersion(selectedRelease);
    alert("Playlet Library version set. Restart playlet to apply changes.");
  }
</script>

<div class="m-5">
  <div class="text-2xl">Developer settings</div>
  <div class="text-xs text-gray-500">
    Options for Playlet developers. Do not change unless you "know what you're
    doing"™
  </div>
</div>

<div class="m-5">
  <div class="text-lg">Playlet Library version</div>
  <div class="text-xs text-gray-500">
    The version of Playlet Lib to use. These correspond to tagged releases on
    Github. Releases that do not have a playlet-lib.zip file are disabled.
  </div>

  <div class="join w-full m-1">
    <select bind:value={selectedRelease} class="select select-bordered join-item w-full mr-1">
      <option selected value="">latest (default)</option>
      {#each releases as release}
        <option disabled={!release.enabled} value={release.name}
          >{release.name}</option
        >
      {/each}
    </select>
    <button class="join-item btn" on:click={apply}>Apply</button>
  </div>
</div>
