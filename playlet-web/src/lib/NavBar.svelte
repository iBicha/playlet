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

<div class="bg-base-100 sticky top-0 z-40 flex items-center min-w-0 px-2 h-16">
  <div class="flex flex-col items-center justify-center min-w-0 mr-2">
    <button on:click={() => ExternalControlProtocol.launchApp(appId)}>
      {#if $appThemeStore === "dark"}
        <PlayletLogoDark />
      {:else}
        <PlayletLogoLight />
      {/if}
    </button>
    <div class="text-xs brightness-75">{version}</div>
  </div>
  <div class="flex-1"></div>
  <div class="flex items-center min-w-0">
    <ThemeSelect />
    {#if currentProfile && currentProfile.username}
      <button
        class="badge badge-outline min-w-0 max-w-[12rem] overflow-hidden whitespace-nowrap truncate cursor-pointer"
        title={currentProfile.username}
        on:click={showProfilesDialog}
      >
        <span class="truncate">{currentProfile.username} </span>
      </button>
    {/if}
    <button
      on:click={showProfilesDialog}
      class="btn btn-ghost btn-circle overflow-hidden w-12 h-12"
    >
      <ProfileAvatar profile={currentProfile} navbar={true} />
    </button>
  </div>
</div>

<ProfilesDialog bind:this={profilesDialog} />
