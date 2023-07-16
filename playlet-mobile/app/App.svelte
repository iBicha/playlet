<script lang="ts">
  import Home from "./components/Home.svelte";
  // @ts-ignore-next-line
  import * as application from "tns-core-modules/application";

  let message: string = "Hello!";

  application.android.on(
    application.AndroidApplication.activityResumedEvent,
    (args: any) => {
      if (
        args.activity.getIntent().getAction() ===
        android.content.Intent.ACTION_SEND
      ) {
        const sharedText = args.activity
          .getIntent()
          .getStringExtra(android.content.Intent.EXTRA_TEXT);

        if (sharedText) {
          message = sharedText;
        }
      }
    }
  );
</script>

<frame>
  <Home {message} />
</frame>
