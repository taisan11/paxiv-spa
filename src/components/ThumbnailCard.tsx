import { A } from "@solidjs/router";
import { Show, type Component } from "solid-js";

interface ThumbnailCardProps {
  href: string;
  imageSrc: string;
  title: string;
  author?: string;
  xRestrict?: number;
  pageCount?: number;
}

export const ThumbnailCard: Component<ThumbnailCardProps> = (props) => {
  const r18Label = () => {
    if ((props.xRestrict ?? 0) >= 2) return "R-18G";
    if ((props.xRestrict ?? 0) >= 1) return "R-18";
    return null;
  };

  const hasMultiPage = () => (props.pageCount ?? 1) > 1;

  return (
    <A href={props.href} class="list-base-item" aria-label={`${props.title}${props.author ? `（作者: ${props.author}）` : ""}`}>
      <div class="list-base-thumb-wrap">
        <img loading="lazy" src={props.imageSrc} alt={props.title} class="list-base-img" />
        {r18Label() && <span class="thumb-badge thumb-badge-r18">{r18Label()}</span>}
        {hasMultiPage() && <span class="thumb-badge thumb-badge-pages">📚 {props.pageCount}</span>}
      </div>
      <div class="list-base-content">
        <strong class="list-base-title">{props.title}</strong>
        <Show when={props.author}>
          <span class="list-base-author">{props.author}</span>
        </Show>
      </div>
    </A>
  );
};
