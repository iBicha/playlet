<script lang="ts">
  import { playletStateStore } from "./Stores";

  const displayNames = {
    version: "Playlet Version",
    lib_version: "Playlet Library Version",
    lib_version_latest: "Playlet Library Latest Version",
    lib_url: "Playlet Library URL",
    lib_url_type: "Playlet Library URL Type",
    git_commit_hash: "Playlet Git Commit Hash",
    lib_git_commit_hash: "Playlet Library Git Commit Hash",
    id: "App ID",
  };

  let appState = {};
  playletStateStore.subscribe((value) => {
    appState = value.app;
  });
</script>

<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th>Key</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {#each Object.entries(displayNames) as [key, value]}
        <tr>
          <td>{value}</td>
          <td>{appState[key]}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
