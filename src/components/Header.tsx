import { A } from "@solidjs/router";
import { onMount } from "solid-js";
import { initIdlePrefetch } from "../lib/prefetch";

export function Header() {
  onMount(() => initIdlePrefetch());

  return (
    <header>
      <h1>
        <A href="/">paxiv</A>
      </h1>
      <nav>
        <A href="/search/i">検索</A>
        <A href="/history">履歴</A>
        <A href="/bookmarks">ブックマーク</A>
        <A href="/setting">設定</A>
      </nav>
    </header>
  );
}
