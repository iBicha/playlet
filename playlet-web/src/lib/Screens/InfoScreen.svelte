<script lang="ts">
  import { getHost } from "lib/Api/Host";
  import { PlayletApi } from "lib/Api/PlayletApi";
  import { playletStateStore, translate } from "lib/Stores";

  export let visibility: boolean;

  const displayNames = [
    {
      key: "app_version",
      displayText: "Playlet App Version",
    },
    {
      key: "lib_version",
      displayText: "Playlet Library Version",
    },
    {
      key: "lib_version_latest",
      displayText: "Playlet Library Latest Version",
    },
    {
      key: "lib_url",
      displayText: "Playlet Library URL",
    },
    {
      key: "lib_url_type",
      displayText: "Playlet Library URL Type",
    },
    {
      key: "app_git_commit_hash",
      displayText: "Playlet App Git Commit Hash",
    },
    {
      key: "lib_git_commit_hash",
      displayText: "Playlet Library Git Commit Hash",
    },
    {
      key: "id",
      displayText: "App ID",
    },
  ];

  const host = `http://${getHost()}`;
  const internalStateLinks = [
    {
      displayText: "App state",
      link: `${host}/api/state`,
    },
    {
      displayText: "Logs",
      link: `${host}/logs/app_logs.txt`,
    },
    {
      displayText: "Logs (previous run)",
      link: `${host}/logs/app_logs_previous.txt`,
    },
    {
      displayText: "Preferences",
      link: `${host}/api/preferences`,
    },
  ];

  function transformValue(key, value) {
    switch (key) {
      case "app_version":
      case "lib_version":
      case "lib_version_latest":
        return `<a class="link" href="https://github.com/iBicha/playlet/releases/tag/v${value}" target="_blank" rel="noopener noreferrer">${value}</a>`;
      case "lib_url":
        const filename =
          value &&
          value.includes("/") &&
          (value.endsWith(".zip") || value.endsWith(".pkg"))
            ? value.substring(value.lastIndexOf("/") + 1)
            : value;
        return `<a class="link" href="${value}" target="_blank" rel="noopener noreferrer">${filename}</a>`;
      case "app_git_commit_hash":
      case "lib_git_commit_hash":
        if (value === "unknown") {
          return value;
        }
        return `<a class="link" href="https://github.com/iBicha/playlet/commit/${value}" target="_blank" rel="noopener noreferrer">${value}</a>`;
      default:
        break;
    }
    return value;
  }

  let appInfo = {};
  let deviceInfo = {};
  let invidiousInfo = {};
  let preferencesInfo = {};
  let profilesInfo = {};
  const feedbackTitle = encodeURIComponent("[Feedback] Playlet");
  let githubUrlIssue = "https://github.com/iBicha/playlet/issues/new";
  let mailToUrl = "mailto:brahim.hadriche@gmail.com";
  const feedbackMessageRaw =
    "You have feedback? Let us know by %IssueStart%creating an issue on Github%IssueEnd% or by %EmailStart%sending an email%EmailEnd%.";

  playletStateStore.subscribe((value) => {
    appInfo = value.app || {};
    deviceInfo = value.device || {};
    invidiousInfo = value.invidious || {};
    preferencesInfo = value.preferences || {};
    profilesInfo = value.profiles || {};
    githubUrlIssue = createGithubIssueUrl();
    mailToUrl = createMailToUrl();
  });

  function createFeedbackBody() {
    return `### Feedback
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
\`\`\`

#### Profiles
\`\`\`
${JSON.stringify(profilesInfo, null, 2)}
\`\`\``;
  }

  function createGithubIssueUrl() {
    const body = createFeedbackBody();
    let bodyEncoded = encodeURIComponent(body);

    // Github url known limit is 8192
    // Limit body, otherwise URL might be too long
    // This is an body arbitrary limit, that should keep us under the 8192 limit
    const encodedBodyLimit = 8000;
    const bodyLimit = 4200;
    if (bodyEncoded.length > encodedBodyLimit) {
      bodyEncoded = encodeURIComponent(
        body.substring(0, bodyLimit) + "\n\n[...truncated]"
      );
    }

    const url = `https://github.com/iBicha/playlet/issues/new?title=${feedbackTitle}&body=${bodyEncoded}`;
    return url;
  }

  function createMailToUrl() {
    const body = encodeURIComponent(createFeedbackBody());
    return `mailto:brahim.hadriche@gmail.com?subject=${feedbackTitle}&body=${body}`;
  }

  async function exportRegistry() {
    try {
      await PlayletApi.showExportRegistryCode();
      const code = prompt("Enter the code you see on your Roku device");
      if (!code) {
        return;
      }
      await PlayletApi.exportRegistry(code);
    } catch (error) {
      console.error(error);
      alert("Failed to export registry. Please try again.");
    }
  }
</script>

<div class={visibility ? "" : "hidden"}>
  <div class="text-base text-center m-8">
    {$translate("Thank you for using Playlet.")}
    <br />
    {@html $translate(feedbackMessageRaw)
      .replace(
        "%IssueStart%",
        `<a class="link" href="${githubUrlIssue}" target="_blank" rel="noopener noreferrer">`
      )
      .replace("%IssueEnd%", "</a>")
      .replace(
        "%EmailStart%",
        `<a class="link" href="${mailToUrl}" target="_blank" rel="noopener noreferrer">`
      )
      .replace("%EmailEnd%", "</a>")}
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
        {#each displayNames as item}
          <tr>
            <td>{item.displayText}</td>
            <td>{@html transformValue(item.key, appInfo[item.key])}</td>
          </tr>
        {/each}

        <tr>
          <th>App internal state</th>
        </tr>

        {#each internalStateLinks as item}
          <tr>
            <td>{item.displayText}</td>
            <td
              ><a
                class="link"
                href={item.link}
                target="_blank"
                rel="noopener noreferrer">link</a
              ></td
            >
          </tr>
        {/each}

        <tr>
          <td>{"Registry"}</td>
          <td
            ><button class="btn btn-outline btn-sm" on:click={exportRegistry}
              >Export registry</button
            ></td
          >
        </tr>
      </tbody>
    </table>
  </div>
</div>
