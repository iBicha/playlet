<script lang="ts">
  import Home from "./components/Home.svelte";
  // @ts-ignore-next-line
  import * as application from "tns-core-modules/application";

  let sharedText: string | undefined = "N/A";

  application.android.on(
    application.AndroidApplication.activityResumedEvent,
    (args: any) => {
      if (
        args.activity.getIntent().getAction() ===
        android.content.Intent.ACTION_SEND
      ) {
        const newSharedText = args.activity
          .getIntent()
          .getStringExtra(android.content.Intent.EXTRA_TEXT);

        if (newSharedText) {
          sharedText = newSharedText;
        }
      }
    }
  );
</script>

<frame>
  <Home {sharedText} />
</frame>
