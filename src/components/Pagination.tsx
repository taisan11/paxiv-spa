import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, type Component } from "solid-js";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
}

export const Pagination: Component<PaginationProps> = (props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageInput, setPageInput] = createSignal(String(Math.max(1, props.currentPage)));

  const safePage = () => Math.max(1, Math.min(props.currentPage, props.lastPage));

  createEffect(() => {
    setPageInput(String(safePage()));
  });

  const goToPage = (value: string) => {
    const requested = Number.parseInt(value, 10);
    if (!Number.isFinite(requested)) return;
    const target = Math.max(1, Math.min(requested, props.lastPage));
    setPageInput(String(target));
    if (target === safePage()) return;
    setSearchParams({ p: String(target) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setSearchParams({ p: String(safePage() - 1) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    setSearchParams({ p: String(safePage() + 1) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav class="pagination" aria-label="ページネーション">
      {safePage() !== 1 && (
        <button class="pagination-button" type="button" onClick={goPrev}>
         前に戻る
        </button>
      )}
      <label class="pagination-current">
        <span class="sr-only">現在のページ</span>
        <input
          type="number"
          min="1"
          max={props.lastPage}
          step="1"
          inputmode="numeric"
          value={pageInput()}
          aria-label={`現在のページ（${props.lastPage}ページ中）`}
          onInput={(event) => setPageInput(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              goToPage(event.currentTarget.value);
            }
          }}
        />
        <span> / {props.lastPage}</span>
      </label>
      {safePage() !== props.lastPage && (
        <button class="pagination-button" type="button" onClick={goNext}>
          次に進む
        </button>
      )}
    </nav>
  );
};
