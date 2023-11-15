<script lang="ts">
  import { ExternalControlProtocol } from "lib/Api/ExternalControlProtocol";

  export let visibility: boolean;

  const BUTTONS = {
    home: "Home",
    rev: "Rev",
    fwd: "Fwd",
    play: "Play",
    select: "Select",
    left: "Left",
    right: "Right",
    down: "Down",
    up: "Up",
    back: "Back",
    instantReplay: "InstantReplay",
    info: "Info",
    backspace: "Backspace",
    search: "Search",
    enter: "Enter",
    volumeDown: "VolumeDown",
    volumeMute: "VolumeMute",
    volumeUp: "VolumeUp",
    powerOff: "PowerOff",
  };

  function pressKey(key) {
    console.log(`Sending key: ${key}`);
    ExternalControlProtocol.pressKey(key);
  }
</script>

<div class={visibility ? "" : "hidden"}>
  <div class="flex flex-col items-center justify-center rounded-xl p-6">
    <div class="flex space-x-4 mb-4">
      <button
        on:click={() => pressKey(BUTTONS.back)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-20 h-10 rounded bg-gray-700 text-white"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class=" text-white"
          ><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg
        ></button
      ><button
        on:click={() => pressKey(BUTTONS.home)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-20 h-10 rounded bg-gray-700 text-white"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class=" text-white"
          ><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
            points="9 22 9 12 15 12 15 22"
          /></svg
        ></button
      >
    </div>
    <div class="flex flex-col items-center mb-4">
      <button
        on:click={() => pressKey(BUTTONS.up)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 mb-2 w-14 h-14 rounded-full bg-gray-700 text-white"
        >⇧</button
      >
      <div class="flex">
        <button
          on:click={() => pressKey(BUTTONS.left)}
          class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 mr-2 w-14 h-14 rounded-full bg-gray-700 text-white"
          >⇦</button
        ><button
          on:click={() => pressKey(BUTTONS.select)}
          class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-14 h-14 rounded-full bg-green-500 text-white"
          >OK</button
        ><button
          on:click={() => pressKey(BUTTONS.right)}
          class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 ml-2 w-14 h-14 rounded-full bg-gray-700 text-white"
          >⇨</button
        >
      </div>
      <button
        on:click={() => pressKey(BUTTONS.down)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 mt-2 w-14 h-14 rounded-full bg-gray-700 text-white"
        >⇩</button
      >
    </div>
    <div class="flex space-x-4 mb-4">
      <button
        on:click={() => pressKey(BUTTONS.instantReplay)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-20 h-10 rounded bg-gray-700 text-white"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class=" text-white"
          ><circle cx="12" cy="12" r="10" /><path d="M16 12H8" /><path
            d="m12 8-4 4 4 4"
          /></svg
        ></button
      ><button
        on:click={() => pressKey(BUTTONS.info)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-20 h-10 rounded bg-gray-700 text-white"
        >*</button
      >
    </div>
    <div class="flex space-x-4 mb-4">
      <button
        on:click={() => pressKey(BUTTONS.rev)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-20 h-10 rounded bg-gray-700 text-white"
        >◄◄</button
      ><button
        on:click={() => pressKey(BUTTONS.play)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-20 h-10 rounded bg-gray-700 text-white"
        >►</button
      ><button
        on:click={() => pressKey(BUTTONS.fwd)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-20 h-10 rounded bg-gray-700 text-white"
        >►►</button
      >
    </div>
    <div class="flex space-x-4">
      <button
        on:click={() => pressKey(BUTTONS.volumeMute)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-14 h-14 rounded-full bg-gray-700 text-white"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class=" text-white"
          ><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /></svg
        ></button
      ><button
        on:click={() => pressKey(BUTTONS.volumeDown)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-14 h-14 rounded-full bg-gray-700 text-white"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class=" text-white"
          ><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /></svg
        ></button
      ><button
        on:click={() => pressKey(BUTTONS.volumeUp)}
        class="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 px-4 py-2 w-14 h-14 rounded-full bg-gray-700 text-white"
      />
    </div>
  </div>
</div>
