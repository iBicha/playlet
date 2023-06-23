<script lang="ts">
  import { onMount } from "svelte";
  import { appThemeStore } from "./Stores";

  let checked;
  appThemeStore.subscribe((value) => {
	checked = value === "dark";
	document.documentElement.setAttribute("data-theme", value);
  });

  onMount(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | undefined;
	if(savedTheme) {
		appThemeStore.set(savedTheme);
	}
  });

  function handleChange() {
	const theme = checked ? "dark" : "light";
	localStorage.setItem("theme", theme);
	appThemeStore.set(theme);
  }
</script>

<div class="flex flex-row m-3">
	<div class="p-2">☀️</div>
	<label class="flex items-center">
		<input type="checkbox" class="toggle toggle-sm p2" bind:checked={checked} on:change={handleChange} />
	</label>
	<div class="p-2">🌙</div>
</div>
