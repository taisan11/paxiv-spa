import { createSignal, For, Show, type Component, type JSX } from "solid-js";
import { useSearchParams } from "@solidjs/router";

export type SearchWorkKind = "illust" | "manga" | "novel";

interface SearchModeOption {
  value: string;
  label: string;
}

const SEARCH_MODE_OPTIONS: Record<SearchWorkKind, SearchModeOption[]> = {
  illust: [
    { value: "s_tag", label: "タグ（部分一致）" },
    { value: "s_tag_full", label: "タグ（完全一致）" },
    { value: "s_tc", label: "タイトル・キャプション" },
    { value: "s_tag_tc", label: "タグ・タイトル・キャプション" }
  ],
  manga: [
    { value: "s_tag", label: "タグ（部分一致）" },
    { value: "s_tag_full", label: "タグ（完全一致）" },
    { value: "s_tc", label: "タイトル・キャプション" },
    { value: "s_tag_tc", label: "タグ・タイトル・キャプション" }
  ],
  novel: [
    { value: "s_tag_only", label: "タグ（部分一致）" },
    { value: "s_tag_full", label: "タグ（完全一致）" },
    { value: "s_tc", label: "本文" },
    { value: "s_tag", label: "タグ・タイトル・キャプション" }
  ]
};

const WORK_LANGUAGES = [
  ["", "すべての言語"], ["ja", "日本語"], ["en", "English"], ["ko", "한국어"],
  ["zh-cn", "简体中文"], ["zh-tw", "繁體中文"], ["id", "Bahasa Indonesia"], ["da", "Dansk"],
  ["de", "Deutsch"], ["es", "Español"], ["es-419", "Español (Latinoamérica)"], ["fil", "Filipino"],
  ["fr", "Français"], ["hr", "Hrvatski"], ["it", "Italiano"], ["ms", "Bahasa Melayu"],
  ["nl", "Nederlands"], ["pl", "Polski"], ["pt-br", "Português (Brasil)"],
  ["pt-pt", "Português (Portugal)"], ["vi", "Tiếng Việt"], ["tr", "Türkçe"],
  ["ru", "Русский"], ["ar", "العربية"], ["th", "ไทย"], ["other", "その他"]
] as const;

const NOVEL_GENRES = [
  ["", "すべてのジャンル"], ["1", "恋愛"], ["2", "異世界ファンタジー"],
  ["3", "現代ファンタジー"], ["4", "ミステリー"], ["5", "ホラー"],
  ["6", "SF"], ["7", "文学"], ["8", "ヒューマンドラマ"],
  ["9", "歴史・時代"], ["10", "BL"], ["11", "百合"], ["12", "子供向け"],
  ["13", "詩"], ["14", "エッセイ・ノンフィクション"],
  ["15", "シナリオ・台本"], ["16", "評論・感想"], ["17", "その他"]
] as const;

const COMMON_TOOLS = [
  "CLIP STUDIO PAINT", "Photoshop", "SAI", "Procreate", "ibisPaint", "MediBang Paint",
  "FireAlpaca", "Illustrator", "Krita", "Blender", "Live2D", "VRoid Studio", "Aseprite",
  "シャープペンシル", "鉛筆", "ボールペン", "色鉛筆", "コピック", "透明水彩", "油彩"
];

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

function addValue(params: URLSearchParams, formData: FormData, name: string) {
  const value = formData.get(name)?.toString().trim();
  if (value) params.set(name, value);
}

function addChecked(params: URLSearchParams, formData: FormData, name: string) {
  if (formData.get(name)) params.set(name, "1");
}

export const SearchOptions: Component<SearchOptionsProps> = (props) => {
  const [currentParams] = useSearchParams<Record<string, string>>();
  const searchWorkKind = () => props.searchWorkKind ?? "illust";
  const sModeOptions = () => SEARCH_MODE_OPTIONS[searchWorkKind()];
  const [showOptions, setShowOptions] = createSignal(false);
  const [selectedMode, setSelectedMode] = createSignal(normalizeSearchMode(searchWorkKind(), currentParams.s_mode));
  const [originalOnly, setOriginalOnly] = createSignal(currentParams.original_only === "1");

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    params.set("q", formData.get("q")?.toString().trim() ?? "");

    for (const name of ["s_mode", "order", "mode", "type", "scd", "ecd", "blt", "bgt", "ratio", "tool", "work_lang", "genre"]) {
      addValue(params, formData, name);
    }
    for (const name of ["ai_type", "csw", "gs", "dgw", "original_only", "replaceable_only"]) {
      addChecked(params, formData, name);
    }

    const resolution = formData.get("resolution")?.toString();
    if (resolution === "large") {
      params.set("wlt", "3000"); params.set("hlt", "3000");
    } else if (resolution === "medium") {
      params.set("wlt", "1000"); params.set("wgt", "2999");
      params.set("hlt", "1000"); params.set("hgt", "2999");
    } else if (resolution === "small") {
      params.set("wgt", "999"); params.set("hgt", "999");
    }

    if (searchWorkKind() === "novel") {
      const lengthType = formData.get("length_type")?.toString() || "characters";
      const min = formData.get("length_min")?.toString().trim();
      const max = formData.get("length_max")?.toString().trim();
      const names = lengthType === "words" ? ["wlt", "wgt"] : lengthType === "reading" ? ["rlt", "rgt"] : ["tlt", "tgt"];
      if (min) params.set(names[0], min);
      if (max) params.set(names[1], max);
    }

    window.location.href = `${props.formAction}?${params.toString()}`;
  };

  const resolutionValue = () => {
    if (currentParams.wlt === "3000" && currentParams.hlt === "3000") return "large";
    if (currentParams.wlt === "1000" && currentParams.wgt === "2999") return "medium";
    if (currentParams.wgt === "999" && currentParams.hgt === "999") return "small";
    return "";
  };

  const novelLength = () => {
    if (currentParams.wlt || currentParams.wgt) return { type: "words", min: currentParams.wlt, max: currentParams.wgt };
    if (currentParams.rlt || currentParams.rgt) return { type: "reading", min: currentParams.rlt, max: currentParams.rgt };
    return { type: "characters", min: currentParams.tlt, max: currentParams.tgt };
  };

  return (
    <form action={props.formAction} method="get" class="searchbox-form" onSubmit={handleSubmit}>
      <input type="text" name="q" placeholder="キーワード" value={props.currentQuery ?? ""} />
      <button type="button" class="search-options-toggle" onClick={() => setShowOptions(!showOptions())}>
        検索オプション
      </button>
      <button type="submit">検索</button>

      <div class={`search-options-content ${showOptions() ? "active" : ""}`}>
        <div class="option-group">
          <label for="s_mode">対象</label>
          <select name="s_mode" id="s_mode" value={selectedMode()} onInput={(event) => setSelectedMode(event.currentTarget.value)}>
            <For each={sModeOptions()}>{(option) => <option value={option.value}>{option.label}</option>}</For>
          </select>
        </div>
        <div class="option-group">
          <label for="order">並び順</label>
          <select name="order" id="order" value={currentParams.order || "date_d"}>
            <option value="date_d">新しい順</option><option value="date">古い順</option>
            <option value="popular_d">人気順</option><option value="popular_male_d">男子の人気順</option>
            <option value="popular_female_d">女子の人気順</option>
          </select>
        </div>
        <div class="option-group">
          <label for="mode">年齢制限</label>
          <select name="mode" id="mode" value={currentParams.mode || "all"}>
            <option value="all">すべて</option><option value="safe">全年齢</option><option value="r18">R-18</option>
          </select>
        </div>
        <Show when={props.showType}>
          <div class="option-group">
            <label for="type">作品の種類</label>
            <select name="type" id="type" value={currentParams.type || "illust_and_ugoira"}>
              <option value="illust_and_ugoira">イラスト・うごくイラスト</option>
              <option value="illust">イラスト</option><option value="ugoira">うごくイラスト</option>
            </select>
          </div>
        </Show>
        <div class="option-group option-checkboxes">
          <label class="checkbox-label"><input type="checkbox" name="ai_type" checked={currentParams.ai_type === "1"} />AI生成作品を表示しない</label>
          <label class="checkbox-label"><input type="checkbox" name="csw" checked={currentParams.csw === "1"} />同じ作者の作品をまとめる</label>
          <Show when={props.showSeriesGroup}>
            <label class="checkbox-label"><input type="checkbox" name="gs" checked={currentParams.gs === "1"} disabled={selectedMode() === "s_tc"} />シリーズ作品をまとめる</label>
          </Show>
          <label class="checkbox-label"><input type="checkbox" name="dgw" checked={currentParams.dgw === "1"} />検索を妨げる可能性がある作品を表示する</label>
        </div>
        <div class="option-group option-range">
          <label>投稿日時</label>
          <input type="date" name="scd" aria-label="投稿日（開始）" value={currentParams.scd || ""} />
          <span>〜</span>
          <input type="date" name="ecd" aria-label="投稿日（終了）" value={currentParams.ecd || ""} />
        </div>
        <div class="option-group option-range">
          <label>ブックマーク数</label>
          <input type="number" min="0" name="blt" placeholder="最小" value={currentParams.blt || ""} />
          <span>〜</span>
          <input type="number" min="0" name="bgt" placeholder="最大" value={currentParams.bgt || ""} />
        </div>

        <Show when={searchWorkKind() !== "novel"}>
          <div class="option-group">
            <label for="resolution">解像度</label>
            <select name="resolution" id="resolution" value={resolutionValue()}>
              <option value="">すべての解像度</option><option value="large">3,000px × 3,000px以上</option>
              <option value="medium">1,000px × 1,000px 〜 2,999px × 2,999px</option>
              <option value="small">999px × 999px以下</option>
            </select>
          </div>
          <div class="option-group">
            <label for="ratio">縦横比</label>
            <select name="ratio" id="ratio" value={currentParams.ratio || ""}>
              <option value="">すべての縦横比</option><option value="0.5">横長</option>
              <option value="-0.5">縦長</option><option value="0">正方形</option>
            </select>
          </div>
          <div class="option-group">
            <label for="tool">制作ツール</label>
            <input type="text" name="tool" id="tool" list="pixiv-tools" value={currentParams.tool || ""} placeholder="すべての制作ツール" />
            <datalist id="pixiv-tools"><For each={COMMON_TOOLS}>{(tool) => <option value={tool} />}</For></datalist>
          </div>
        </Show>

        <Show when={searchWorkKind() === "novel"}>
          <Show when={props.showWorkLang}>
            <div class="option-group">
              <label for="work_lang">作品の言語</label>
              <select name="work_lang" id="work_lang" value={currentParams.work_lang || ""}>
                <For each={WORK_LANGUAGES}>{(([value, label]) => <option value={value}>{label}</option>)}</For>
              </select>
            </div>
          </Show>
          <div class="option-group option-range">
            <label for="length_type">本文の長さ</label>
            <select name="length_type" id="length_type" value={novelLength().type}>
              <option value="characters">文字数</option><option value="words">単語数</option><option value="reading">読了目安（分）</option>
            </select>
            <input type="number" min="0" name="length_min" placeholder="最小" value={novelLength().min || ""} />
            <span>〜</span>
            <input type="number" min="0" name="length_max" placeholder="最大" value={novelLength().max || ""} />
          </div>
          <div class="option-group option-checkboxes">
            <label class="checkbox-label"><input type="checkbox" name="original_only" checked={originalOnly()} onInput={(event) => setOriginalOnly(event.currentTarget.checked)} />オリジナル作品のみ</label>
            <label for="genre">オリジナル作品のジャンル</label>
            <select name="genre" id="genre" value={currentParams.genre || ""} disabled={!originalOnly()}>
              <For each={NOVEL_GENRES}>{(([value, label]) => <option value={value}>{label}</option>)}</For>
            </select>
            <label class="checkbox-label"><input type="checkbox" name="replaceable_only" checked={currentParams.replaceable_only === "1"} />単語変換対応作品のみ</label>
          </div>
        </Show>
      </div>
    </form>
  );
};
