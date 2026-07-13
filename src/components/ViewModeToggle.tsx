import type { Component } from "solid-js";

export type ViewMode = "grid" | "list";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeToggle: Component<ViewModeToggleProps> = (props) => (
  <div class="view-mode-toggle" role="group" aria-label="表示形式">
    <button
      type="button"
      class={props.mode === "grid" ? "active" : ""}
      aria-pressed={props.mode === "grid"}
      onClick={() => props.onChange("grid")}
    >
      ▦ グリッド
    </button>
    <button
      type="button"
      class={props.mode === "list" ? "active" : ""}
      aria-pressed={props.mode === "list"}
      onClick={() => props.onChange("list")}
    >
      ☰ リスト
    </button>
  </div>
);
