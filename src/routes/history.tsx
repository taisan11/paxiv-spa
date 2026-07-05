import { createSignal, onMount, For, type Component } from "solid-js";

interface HistoryItem {
  id: string;
  title: string;
  type: "artwork" | "novel";
  url: string;
  timestamp: number;
}

type HistorySection = "history-artworks" | "history-novel" | "bookmarks-artworks" | "bookmarks-novel" | "follows";

const HISTORY_KEY = "paxiv_history";
const BOOKMARK_KEY = "paxiv_bookmarks";
const FOLLOW_KEY = "paxiv_follows";

function getHistory(type: string): HistoryItem[] {
  try {
    const data = localStorage.getItem(`${HISTORY_KEY}_${type}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getBookmarks(type: string): HistoryItem[] {
  try {
    const data = localStorage.getItem(`${BOOKMARK_KEY}_${type}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getFollows(): HistoryItem[] {
  try {
    const data = localStorage.getItem(FOLLOW_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function clearSection(section: HistorySection) {
  if (section === "follows") {
    localStorage.removeItem(FOLLOW_KEY);
  } else if (section.startsWith("bookmarks")) {
    const type = section.replace("bookmarks-", "");
    localStorage.removeItem(`${BOOKMARK_KEY}_${type}`);
  } else {
    const type = section.replace("history-", "");
    localStorage.removeItem(`${HISTORY_KEY}_${type}`);
  }
}

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
      <p>端末側に保存される履歴・フォロー・ブックマークは最大1000件です。</p>
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
