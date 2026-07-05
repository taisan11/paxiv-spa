import { createSignal, onMount, onCleanup, Show } from "solid-js";

export function OfflineNotice() {
  const [online, setOnline] = createSignal(navigator.onLine);

  onMount(() => {
    const h = () => setOnline(navigator.onLine);
    window.addEventListener("online", h);
    window.addEventListener("offline", h);
    onCleanup(() => {
      window.removeEventListener("online", h);
      window.removeEventListener("offline", h);
    });
  });

  return (
    <Show when={!online()}>
      <div class="offline-banner">オフライン中 - キャッシュされたコンテンツを表示しています</div>
    </Show>
  );
}
