<script lang="ts">
  import { onMount } from "svelte";
  import InstanceInfo from "./lib/InstanceInfo.svelte";
  import NavBar from "./lib/NavBar.svelte";
  import PlayVideo from "./lib/PlayVideo.svelte";
  import ClearSearchHistory from "./lib/ClearSearchHistory.svelte";
  import { PlayletApi } from "./lib/PlayletApi";
  import { playletStateStore } from "./lib/Stores";

  onMount(async () => {
    const playletState = await PlayletApi.getState();
    playletStateStore.set(playletState);
  });
</script>

<main>
  <NavBar />
  <InstanceInfo />
  <PlayVideo />
  <ClearSearchHistory />
</main>
