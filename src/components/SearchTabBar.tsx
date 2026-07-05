import { A } from "@solidjs/router";
import type { Component } from "solid-js";

interface SearchTabBarProps {
  q: string;
}

export const SearchTabBar: Component<SearchTabBarProps> = (props) => {
  const encodedQ = () => encodeURIComponent(props.q);

  return (
    <nav class="search-tab-bar">
      <A href={`/search/i?q=${encodedQ()}`}>イラスト</A>
      <A href={`/search/m?q=${encodedQ()}`}>マンガ</A>
      <A href={`/search/n?q=${encodedQ()}`}>ノベル</A>
    </nav>
  );
};
