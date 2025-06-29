<script lang="ts">
  import { playletStateStore, translate } from "lib/Stores";
  import { PlayletApi } from "./Api/PlayletApi";
  import { get } from "svelte/store";

  export function show() {
    modal.showModal();
    refreshProfiles();
  }

  export function close() {
    modal.close();
  }

  function onClose() {
    accordionState = null;
  }

  let modal;

  let profiles = [];
  let currentProfile;

  let authUrl;
  let currentInstance;
  let currentInstanceName;

  let accordionState = null;

  playletStateStore.subscribe((value) => {
    authUrl = value?.invidious?.auth_url;
    currentInstance = value?.invidious?.invidious_instance || "";
    if (!currentInstance) {
      const trFn = get(translate);
      currentInstanceName = trFn("Playlet built-in backend");
    } else {
      currentInstanceName = currentInstance;
    }
    profiles = value?.profiles?.profiles ?? [];
    currentProfile = profiles.find(
      (p) => p.id === value?.profiles?.currentProfile
    );
  });

  function refreshProfiles() {
    PlayletApi.getProfiles().then((profiles) => {
      const state = get(playletStateStore);
      state.profiles = profiles;
      playletStateStore.set(state);
    });
  }

  async function activate(profileId: string) {
    await PlayletApi.activateProfile(profileId);
    window.location.reload();
  }

  async function logout(profileId: string) {
    await PlayletApi.logout(profileId);
    if (profileId === currentProfile?.id) {
      window.location.reload();
      return;
    }
    refreshProfiles();
  }

  function loginToInvidious() {
    if (!currentInstance) {
      alert("No Invidious instance configured. Please set one in settings.");
      return;
    }

    if (!authUrl) {
      alert("Error with login, please refresh the page.");
      return;
    }

    window.location = authUrl;
  }

  function loginToYoutube() {
    alert("Please use your Roku device to login to YouTube.");
  }
</script>

<dialog bind:this={modal} class="modal" on:close={onClose}>
  <form method="dialog" class="modal-box bg-base-100">
    <div class="flex flex-col items-center">
      <div class="text-xl font-medium m-4">{$translate("Profiles")}</div>

      {#each profiles as profile}
        <div class="collapse collapse-arrow bg-base-300 m-1">
          <input
            type="radio"
            name="profiles-accordion"
            value={profile.id}
            bind:group={accordionState}
          />
          <div class="collapse-title flex">
            <div>
              <div class="avatar placeholder">
                <div
                  class="rounded-full w-12 {profile.id === currentProfile?.id
                    ? 'ring ring-primary ring-offset-base-100 ring-offset-2'
                    : ''} "
                  style="background-color: {profile.color}"
                >
                  {#if profile.type === "youtube" && profile.thumbnail}
                    <img src={profile.thumbnail} alt="Avatar" />
                  {:else}
                    <span class="text-xl font-medium text-gray-200"
                      >{profile.username.substring(0, 1).toUpperCase()}</span
                    >
                  {/if}
                </div>
              </div>
            </div>
            <div class="ml-4">
              <div class="font-medium">
                {profile.username}
              </div>
              <div class="text-xs font-light">
                {#if profile.type === "youtube"}
                  <div>YouTube</div>
                {:else}
                  <a
                    class="link"
                    href={profile.serverUrl}
                    target="_blank"
                    rel="noopener noreferrer">{profile.serverUrl}</a
                  >
                {/if}
              </div>
            </div>
          </div>
          <div class="collapse-content">
            {#if profile.id !== currentProfile?.id}
              <button
                on:click={() => activate(profile.id)}
                class="btn btn-primary m-1">{$translate("Activate")}</button
              >
            {/if}
            <button
              on:click={() => logout(profile.id)}
              class="btn btn-primary m-1">{$translate("Logout")}</button
            >
          </div>
        </div>
      {/each}
      <div class="flex items-center">
        <div class="flex flex-col">
          <button class="btn btn-primary m-2" on:click={loginToYoutube}>
            <div class="">
              <div class="text-m">{$translate("Login to YouTube")}</div>
            </div>
          </button>
          <button class="btn btn-primary m-2" on:click={loginToInvidious}>
            <div class="">
              <div class="text-m">{$translate("Login to Invidious")}</div>
              <div class="text-xs font-light">{currentInstanceName}</div>
            </div>
          </button>
        </div>
        <button class="btn m-2">{$translate("Close")}</button>
      </div>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button>{$translate("Close")}</button>
  </form>
</dialog>
