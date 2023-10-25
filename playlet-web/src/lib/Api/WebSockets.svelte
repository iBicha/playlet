<script lang="ts">
  import { onMount } from "svelte";

  onMount(() => {
    const ws = new WebSocket(`ws://${window.location.host}`);
    ws.onopen = () => {
      console.log("WebSocket connected!");
      const message = "Hello?";
      console.log(`Sending: "${message}"`);
      ws.send(message);
    };

    ws.onmessage = (event) => {
      console.log(`Received: "${event.data}"`);
    };

    ws.onclose = () => {
      console.log("WebSocket closed!");
    };

    ws.onerror = (error) => {
      console.log("WebSocket error: ", error);
    };
  });
</script>
