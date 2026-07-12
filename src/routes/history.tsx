import { createSignal, onMount, For, type Component } from "solid-js";
import { getHistory, getBookmarks, getFollows, clearSection, type HistoryItem } from "../lib/storage";
import { isNativeApp } from "../lib/native";

type HistorySection = "history-artworks" | "history-novel" | "bookmarks-artworks" | "bookmarks-novel" | "follows";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

const History: Component = () => {
  const [section, setSection] = createSignal<HistorySection>("history-artworks");
  const [items, setItems] = createSignal<HistoryItem[]>([]);

  const loadItems = (sec: HistorySection) => {
    setSection(sec);
    let loaded: HistoryItem[] = [];
    switch (sec) {
      case "history-artworks":
        loaded = getHistory("artwork");
        break;
      case "history-novel":
        loaded = getHistory("novel");
        break;
      case "bookmarks-artworks":
        loaded = getBookmarks("artwork");
        break;
      case "bookmarks-novel":
        loaded = getBookmarks("novel");
        break;
      case "follows":
        loaded = getFollows();
        break;
    }
    loaded.sort((a, b) => b.timestamp - a.timestamp);
    setItems(loaded);
  };

  onMount(() => loadItems("history-artworks"));

  const handleClear = () => {
    clearSection(section());
    loadItems(section());
  };

  const tabs: { key: HistorySection; label: string }[] = [
    { key: "history-artworks", label: "閲覧: イラスト|漫画" },
    { key: "history-novel", label: "閲覧: ノベル" },
    { key: "bookmarks-artworks", label: "ブックマーク: イラスト|漫画" },
    { key: "bookmarks-novel", label: "ブックマーク: ノベル" },
    { key: "follows", label: "フォロー中" }
  ];

  return (
    <>
      <h1>履歴</h1>
      <p>{isNativeApp() ? "Native版では閲覧履歴を件数無制限で保存します。" : "履歴・フォロー・ブックマークは最大1000件です。"}</p>
      <div class="history-tabs">
        <For each={tabs}>
          {(tab) => (
            <button
              class={section() === tab.key ? "active" : ""}
              onClick={() => loadItems(tab.key)}
            >
              {tab.label}
            </button>
          )}
        </For>
      </div>
      <ul id="history-list">
        {items().length === 0 ? (
          <li>履歴がありません。</li>
        ) : (
          <For each={items()}>
            {(item) => (
              <li>
                <a href={item.url}>{item.title}</a>
                <span>{timeAgo(item.timestamp)}</span>
              </li>
            )}
          </For>
        )}
      </ul>
      {items().length > 0 && (
        <button id="clear-history-btn" onClick={handleClear}>
          表示中の項目を削除
        </button>
      )}
      <a href="/">トップページに戻る</a>
    </>
  );
};

export default History;
