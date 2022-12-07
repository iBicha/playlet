<script lang="ts">
  import { onMount } from "svelte";
  import playletLogo from "./assets/logo-dark.svg";
  import Counter from "./lib/Counter.svelte";
  import CurrentInstance from "./lib/CurrentInstance.svelte";
  import { getHost } from "./lib/Host";
  import { PlayletApi } from "./lib/PlayletApi";
  import { playletStateStore } from "./lib/Stores";

  onMount(async () => {
    const playletState = await PlayletApi.getState();
    playletStateStore.set(playletState);
  });
</script>

<main>
  <div>
    <img src={playletLogo} class="logo" alt="Playlet Logo" />
  </div>

  <div class="card">
    <Counter />
  </div>
  <div class="card">
    Host: {getHost()}
  </div>
  <div class="card">
    <CurrentInstance />
  </div>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
</style>
