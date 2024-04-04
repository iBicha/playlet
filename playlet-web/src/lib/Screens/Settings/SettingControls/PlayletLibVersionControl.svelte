<script lang="ts">
  import { onMount } from "svelte";
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore, tr } from "lib/Stores";
  import { ExternalControlProtocol } from "lib/Api/ExternalControlProtocol";
  import { get } from "svelte/store";

  let selectedRelease = "";
  let releases = [];

  let libUrl;
  let libUrlType;
  let appId = "693751";

  onMount(async () => {
    releases = await fetchReleaseTags();
    setCurrentlyUsedRelease();
  });

  playletStateStore.subscribe((value) => {
    libUrl = value?.app?.lib_url;
    libUrlType = value?.app?.lib_url_type;
    if (value?.app?.id) {
      appId = value?.app?.id;
    }
    setCurrentlyUsedRelease();
  });

  function setCurrentlyUsedRelease() {
    if (libUrlType !== "custom") {
      return;
    }
    if (releases.length === 0) {
      return;
    }

    for (let i = 0; i < releases.length; i++) {
      const release = releases[i].name;
      if (
        libUrl ===
          `https://github.com/iBicha/playlet/releases/download/${release}/playlet-lib.zip` ||
        libUrl ===
          `https://github.com/iBicha/playlet/releases/download/${release}/playlet-lib.squashfs.pkg`
      ) {
        selectedRelease = release;
        break;
      }
    }
  }

  async function fetchReleaseTags() {
    const response = await fetch(
      "https://api.github.com/repos/iBicha/playlet/releases"
    );
    const releases = await response.json();
    return releases.map((release) => {
      return {
        name: release.tag_name,
        enabled:
          release.assets.filter(
            (asset) =>
              asset.name === "playlet-lib.zip" ||
              asset.name === "playlet-lib.squashfs.pkg"
          ).length > 0,
      };
    });
  }

  async function apply() {
    let version = selectedRelease;
    if (version === "") {
      version = "latest";
    }

    const trFn = get(tr);

    if (
      confirm(
        trFn(
          "Are you sure you want to change the Playlet Library version to %1"
        ).replace("%1", version)
      ) +
      `\n` +
      trFn("This will restart Playlet.")
    ) {
      await PlayletApi.setPlayletLibVersion(selectedRelease);
      alert(trFn("Playlet Library version changed. Playlet will now restart."));
      await ExternalControlProtocol.restartApp(appId);
    }
  }
</script>

<div class="m-5">
  <div class="text-lg">{$tr("Playlet Library version")}</div>
  <div class="text-xs text-gray-500">
    {$tr(
      "The version of Playlet Lib to use. These correspond to tagged releases on Github. Releases that do not have a playlet-lib.zip file are disabled."
    )}
  </div>

  <div class="join w-full m-1">
    <select
      bind:value={selectedRelease}
      class="select select-bordered join-item w-full mr-1"
    >
      <option selected value="">{$tr("Latest (default)")}</option>
      {#each releases as release}
        <option disabled={!release.enabled} value={release.name}
          >{release.name}</option
        >
      {/each}
    </select>
    <button class="join-item btn" on:click={apply}>{$tr("Apply")}</button>
  </div>
</div>
