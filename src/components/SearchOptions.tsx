import { createSignal, For, type Component, type JSX } from "solid-js";

export type SearchWorkKind = "illust" | "manga" | "novel";

interface SearchModeOption {
  value: string;
  label: string;
}

const SEARCH_MODE_OPTIONS: Record<SearchWorkKind, SearchModeOption[]> = {
  illust: [
    { value: "s_tag_full", label: "完全一致" },
    { value: "s_tag", label: "タグ一致" },
    { value: "s_tc", label: "タイトル・キャプション一致" },
    { value: "s_text", label: "タイトルタグキャプション" }
  ],
  manga: [
    { value: "s_tag_full", label: "完全一致" },
    { value: "s_tag", label: "タグ一致" },
    { value: "s_tc", label: "タイトル・キャプション一致" },
    { value: "s_text", label: "タイトルタグキャプション" }
  ],
  novel: [
    { value: "s_tag_full", label: "完全一致" },
    { value: "s_tag", label: "タグ一致" },
    { value: "s_text", label: "本文検索" }
  ]
};

export function normalizeSearchMode(workKind: SearchWorkKind, raw: string | undefined): string {
  const options = SEARCH_MODE_OPTIONS[workKind];
  const fallback = "s_tag_full";
  if (!raw) return fallback;
  return options.some((option) => option.value === raw) ? raw : fallback;
}

interface SearchOptionsProps {
  formAction: string;
  showSeriesGroup?: boolean;
  showWorkLang?: boolean;
  showType?: boolean;
  currentQuery?: string;
  searchWorkKind?: SearchWorkKind;
}

export const SearchOptions: Component<SearchOptionsProps> = (props) => {
  const searchWorkKind = () => props.searchWorkKind ?? "illust";
  const sModeOptions = () => SEARCH_MODE_OPTIONS[searchWorkKind()];
  const defaultSMode = "s_tag_full";

  const [showOptions, setShowOptions] = createSignal(false);

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const q = formData.get("q")?.toString() || "";
    const params = new URLSearchParams();
    params.set("q", q);

    const sMode = formData.get("s_mode")?.toString();
    if (sMode && sMode !== defaultSMode) params.set("s_mode", sMode);

    const type = formData.get("type")?.toString();
    if (type) params.set("type", type);

    const workLang = formData.get("work_lang")?.toString();
    if (workLang) params.set("work_lang", workLang);

    window.location.href = `${props.formAction}?${params.toString()}`;
  };

  return (
    <>
      <form action={props.formAction} method="get" class="searchbox-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="q"
          placeholder="キーワード"
          value={props.currentQuery ?? ""}
        />
        <div class="search-options">
          <button type="button" onClick={() => setShowOptions(!showOptions())}>
            検索オプション
          </button>
          <div class={`search-options-content ${showOptions() ? "active" : ""}`}>
            <div class="option-group">
              <label class="checkbox-label">
                <input type="checkbox" name="ai_block" />
                AI作品をブロック
              </label>
            </div>
            <div class="option-group">
              <label class="checkbox-label">
                <input type="checkbox" name="author_group" />
                同じ作者の作品をまとめる
              </label>
            </div>
            {props.showSeriesGroup && (
              <div class="option-group">
                <label class="checkbox-label">
                  <input type="checkbox" name="series_group" />
                  シリーズ単位で表示
                </label>
              </div>
            )}
            <div class="option-group">
              <label for="s_mode">検索モード</label>
              <select name="s_mode" id="s_mode" data-default-mode={defaultSMode}>
                <For each={sModeOptions()}>
                  {(mode) => <option value={mode.value}>{mode.label}</option>}
                </For>
              </select>
            </div>
            {props.showType && (
              <div class="option-group">
                <label for="type">作品タイプ</label>
                <select name="type" id="type">
                  <option value="illust_and_ugoira">イラスト・うごイラ</option>
                  <option value="illust">イラストのみ</option>
                  <option value="ugoira">うごイラのみ</option>
                </select>
              </div>
            )}
            {props.showWorkLang && (
              <div class="option-group">
                <label for="work_lang">言語</label>
                <select name="work_lang" id="work_lang">
                  <option value="ja">日本語</option>
                  <option value="en">英語</option>
                  <option value="zh">中国語</option>
                  <option value="ko">韓国語</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <button type="submit">検索</button>
      </form>
    </>
  );
};
