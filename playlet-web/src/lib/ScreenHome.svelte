<script lang="ts">
  import { onMount } from "svelte";
  import { PlayletApi } from "./PlayletApi";
  import ScreenHomeRow from "./ScreenHomeRow.svelte";
  import { invidiousVideoApiStore } from "./Stores";

  export let visibility: boolean;

  let homeLayoutFile = [];
  onMount(async () => {
    PlayletApi.getHomeLayoutFile().then((value) => {
      homeLayoutFile = value;
    });

    PlayletApi.getInvidiousVideoApiFile().then((invidiousVideoApiFile) => {
      const invidiousVideoApiDefinitions =
        invidiousVideoApiFile.endpoints.reduce((acc, endpoint) => {
          acc[endpoint.name] = endpoint;
          return acc;
        }, {});
      invidiousVideoApiStore.set(invidiousVideoApiDefinitions);
    });
  });
</script>

<div class={visibility ? "" : "hidden"}>
  {#each homeLayoutFile as homeLayoutItem}
    <ScreenHomeRow requestData={homeLayoutItem} />
  {/each}
</div>
