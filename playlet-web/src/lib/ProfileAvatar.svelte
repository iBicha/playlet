<script lang="ts">
  import { playletStateStore } from "lib/Stores";
  import UserIcon from "assets/user.svg.svelte";

  let currentProfile;

  playletStateStore.subscribe((value) => {
    let profiles = value?.profiles?.profiles ?? [];
    currentProfile = profiles.find(
      (p) => p.id === value?.profiles?.currentProfile
    );
  });
</script>

<div>
  {#if currentProfile && currentProfile.username}
    <div class="avatar placeholder m-1.5">
      <div
        class="bg-neutral text-neutral-content rounded-full w-8 ring ring-offset-base-100 ring-offset-2"
      >
        <span class="text-xl font-medium"
          >{currentProfile.username.substring(0, 1).toUpperCase()}</span
        >
      </div>
    </div>
  {:else}
    <div class="w-8 rounded-full">
      <UserIcon />
    </div>
  {/if}
</div>
