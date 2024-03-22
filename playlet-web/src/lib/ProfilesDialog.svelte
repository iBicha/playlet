<script lang="ts">
  import { playletStateStore, tr } from "lib/Stores";
  import { PlayletApi } from "./Api/PlayletApi";
  import { get } from "svelte/store";

  export function show() {
    modal.showModal();
    refreshProfiles();
  }

  export function close() {
    modal.close();
    accordionState = null;
  }

  let modal;

  let profiles = [];
  let currentProfile;

  let authUrl;
  let currentInstance;

  let accordionState = null;

  playletStateStore.subscribe((value) => {
    authUrl = value?.invidious?.auth_url;
    currentInstance = value?.invidious?.current_instance;
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

  function login() {
    if (!authUrl) {
      alert("Error with login, please refresh the page.");
      return;
    }
    window.location = authUrl;
  }
</script>

<dialog bind:this={modal} class="modal">
  <form method="dialog" class="modal-box bg-base-100">
    <div class="flex flex-col items-center">
      <div class="text-xl font-medium m-4">{$tr("Profiles")}</div>

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
                  <span class="text-xl font-medium text-gray-200"
                    >{profile.username.substring(0, 1).toUpperCase()}</span
                  >
                </div>
              </div>
            </div>
            <div class="ml-4">
              <div class="font-medium">
                {profile.username}
              </div>
              <div class="text-xs font-light">
                <a
                  class="link"
                  href={profile.serverUrl}
                  target="_blank"
                  rel="noopener noreferrer">{profile.serverUrl}</a
                >
              </div>
            </div>
          </div>
          <div class="collapse-content">
            {#if profile.id !== currentProfile?.id}
              <button
                on:click={() => activate(profile.id)}
                class="btn btn-primary m-1">{$tr("Activate")}</button
              >
            {/if}
            <button
              on:click={() => logout(profile.id)}
              class="btn btn-primary m-1">{$tr("Logout")}</button
            >
          </div>
        </div>
      {/each}
      <div class="flex items-center">
        <button class="btn btn-primary" on:click={login}>
          <div class="">
            <div class="text-m">{$tr("Login to Invidious")}</div>
            <div class="text-xs font-light">{currentInstance}</div>
          </div>
        </button>
        <button class="btn m-6" on:click={close}>{$tr("Close")}</button>
      </div>
    </div>
  </form>
  <form method="dialog" class="modal-backdrop">
    <button on:click={close}>{$tr("Close")}</button>
  </form>
</dialog>
