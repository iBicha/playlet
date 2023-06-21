<script lang="ts">
  import { playletStateStore } from "./Stores";

  export let visibility: boolean;

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

  let appInfo = {};
  let deviceInfo = {};
  let invidiousInfo = {};
  let preferencesInfo = {};
  let githubUrlIssue = "https://github.com/iBicha/playlet/issues/new";

  playletStateStore.subscribe((value) => {
    appInfo = value.app || {};
    deviceInfo = value.device || {};
    invidiousInfo = value.invidious || {};
    preferencesInfo = value.preferences || {};
    githubUrlIssue = CreateGithubIssueUrl();
  });

  function CreateGithubIssueUrl() {
    let title = "[Feedback] Playlet";
    let body = `### Feedback
_insert feedback here_

#### App Info
\`\`\`
${JSON.stringify(appInfo, null, 2)}
\`\`\`

#### Device Info
\`\`\`
${JSON.stringify(deviceInfo, null, 2)}
\`\`\`

#### Invidious settings
\`\`\`
${JSON.stringify(invidiousInfo, null, 2)}
\`\`\`

#### User preferences
\`\`\`
${JSON.stringify(preferencesInfo, null, 2)}
\`\`\``;
    return `https://github.com/iBicha/playlet/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }
</script>

<div class={visibility ? "" : "hidden"}>
  <div class="text-base text-center m-8">
    Thank you for using Playlet.<br/> You have feedback? Let us know by <a class="link" href={githubUrlIssue} target="_blank" rel="noopener noreferrer">creating an issue on Github</a>.
  </div>
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
            <td>{appInfo[key]}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>  
</div>
