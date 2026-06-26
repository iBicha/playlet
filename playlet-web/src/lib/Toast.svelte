<script lang="ts">
  import { toastStore, removeToast } from "lib/Toast";

  const alertClass: Record<string, string> = {
    success: "alert-success",
    error: "alert-error",
    info: "alert-info",
    warning: "alert-warning",
  };
</script>

<div class="toast toast-end toast-bottom z-50">
  {#each $toastStore as toast (toast.id)}
    <div class="alert {alertClass[toast.type] ?? 'alert-info'}">
      <span>{toast.message}</span>
      <button
        class="btn btn-ghost btn-xs"
        on:click={() => removeToast(toast.id)}>✕</button
      >
    </div>
  {/each}
</div>
