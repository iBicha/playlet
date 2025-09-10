<script lang="ts">
  export let profile = null;
  export let navbar = false;
  export let selected = false;
  import UserIcon from "assets/user.svg.svelte";
  import { playletStateStore } from "lib/Stores";

  let currentProfile = profile;

  if (!profile) {
    playletStateStore.subscribe((value) => {
      let profiles = value?.profiles?.profiles ?? [];
      currentProfile = profiles.find(
        (p) => p.id === value?.profiles?.currentProfile
      );
    });
  }
</script>

{#if currentProfile && currentProfile.username}
  <div class={`avatar ${navbar ? "w-8 h-8 m-1" : "w-12 h-12"}`}>
    <div
      class={`rounded-full flex items-center justify-center w-full h-full
        ${
          navbar
            ? "border-2 border-primary"
            : selected
              ? "ring ring-primary ring-offset-base-100 ring-offset-2"
              : "ring ring-offset-base-100 ring-offset-2"
        }
      `}
      style="background-color: {currentProfile.color};"
    >
      {#if currentProfile.type === "youtube" && currentProfile.thumbnail}
        <img
          src={currentProfile.thumbnail}
          alt="Avatar"
          class="object-cover w-full h-full rounded-full"
        />
      {:else}
        <span
          class="text-lg font-medium text-gray-200 flex items-center justify-center w-full h-full"
        >
          {currentProfile.username.substring(0, 1).toUpperCase()}
        </span>
      {/if}
    </div>
  </div>
{:else}
  <div class={`avatar ${navbar ? "w-8 h-8 m-1" : "w-12 h-12"}`}>
    <div
      class="rounded-full bg-base-300 w-full h-full flex items-center justify-center"
    >
      <UserIcon />
    </div>
  </div>
{/if}
