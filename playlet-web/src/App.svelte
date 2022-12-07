<script lang="ts">
  import playletLogo from "./assets/logo-dark.svg";
  import Counter from "./lib/Counter.svelte";
</script>

<main>
  <div>
    <img src={playletLogo} class="logo" alt="Playlet Logo" />
  </div>
  <h1>Playlet</h1>

  <div class="card">
    <Counter />
  </div>
</main>

<style>
  .logo {
    height: 16em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
</style>
