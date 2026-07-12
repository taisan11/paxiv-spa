import { A } from "@solidjs/router";
import { createSignal, For, onMount, type Component } from "solid-js";
import { getBookmarks, toggleBookmark, type HistoryItem } from "../lib/storage";

type BookmarkType = "artwork" | "novel";

const Bookmarks: Component = () => {
  const [type, setType] = createSignal<BookmarkType>("artwork");
  const [items, setItems] = createSignal<HistoryItem[]>([]);

  const load = (next: BookmarkType) => {
    setType(next);
    setItems(getBookmarks(next).sort((a, b) => b.timestamp - a.timestamp));
  };

  const remove = (item: HistoryItem) => {
    toggleBookmark(item.id, item.title, item.type as BookmarkType, item.url);
    load(type());
  };

  onMount(() => load("artwork"));

  return (
    <>
      <h1>ブックマーク</h1>
      <div class="history-tabs" role="tablist" aria-label="ブックマーク種別">
        <button class={type() === "artwork" ? "active" : ""} onClick={() => load("artwork")}>イラスト・漫画</button>
        <button class={type() === "novel" ? "active" : ""} onClick={() => load("novel")}>小説</button>
      </div>
      <ul id="history-list">
        {items().length === 0 ? <li>ブックマークがありません。</li> : (
          <For each={items()}>{(item) => (
            <li>
              <A href={item.url}>{item.title}</A>
              <button class="bookmark-remove-btn" onClick={() => remove(item)} aria-label={`${item.title}を削除`}>削除</button>
            </li>
          )}</For>
        )}
      </ul>
      <A href="/">トップページに戻る</A>
    </>
  );
};

export default Bookmarks;
