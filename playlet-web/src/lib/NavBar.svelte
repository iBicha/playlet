<script lang="ts">
  import PlayletLogoDark from "assets/logo-dark.svg.svelte";
  import PlayletLogoLight from "assets/logo-light.svg.svelte";
  import { ExternalControlProtocol } from "lib/Api/ExternalControlProtocol";
  import { appThemeStore, playletStateStore } from "lib/Stores";
  import ThemeSelect from "lib/ThemeToggle.svelte";
  import ProfilesDialog from "./ProfilesDialog.svelte";
  import ProfileAvatar from "./ProfileAvatar.svelte";

  let profilesDialog;
  let version;
  let currentProfile;
  let appId = "693751";

  playletStateStore.subscribe((value) => {
    version = getAppVersion(value);
    if (value?.app?.id) {
      appId = value?.app?.id;
    }
    let profiles = value?.profiles?.profiles ?? [];
    currentProfile = profiles.find(
      (p) => p.id === value?.profiles?.currentProfile
    );
  });

  const showProfilesDialog = () => {
    profilesDialog.show();
  };

  function getAppVersion(playletState) {
    let version = playletState?.app?.lib_version ?? "";
    const appId = playletState?.app?.id;
    if (appId === "dev") {
      version += "-dev";
    }

    if (
      playletState?.app?.lib_url_type === "custom" &&
      (playletState?.app?.lib_url ===
        "https://github.com/iBicha/playlet/releases/download/canary/playlet-lib.zip" ||
        playletState?.app?.lib_url ===
          "https://github.com/iBicha/playlet/releases/download/canary/playlet-lib.squashfs.pkg")
    ) {
      version += "-canary";
    }

    if (version) {
      version = `v${version}`;
    }

    return version;
  }
</script>

<div class="navbar bg-base-100 sticky top-0 z-40">
  <div class="flex-1">
    <div class="flex flex-col justify-center items-center">
      <button on:click={() => ExternalControlProtocol.launchApp(appId)}>
        {#if $appThemeStore === "dark"}
          <PlayletLogoDark />
        {:else}
          <PlayletLogoLight />
        {/if}
      </button>
      <div class="text-xs brightness-75">{version}</div>
    </div>
  </div>
  <div class="flex-none">
    <ThemeSelect />
    {#if currentProfile && currentProfile.username}
      <div class="badge badge-outline">
        <span>
          <!-- TODO:P2 use text-ellipsis -->
          {currentProfile.username.length > 10
            ? `${currentProfile.username.slice(0, 10)}…`
            : currentProfile.username}
        </span>
      </div>
    {/if}
    <button
      on:click={showProfilesDialog}
      class="btn btn-ghost btn-circle avatar"
    >
      <ProfileAvatar />
    </button>
  </div>
</div>

<ProfilesDialog bind:this={profilesDialog} />
