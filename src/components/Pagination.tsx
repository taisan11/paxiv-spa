import { useSearchParams } from "@solidjs/router";
import type { Component } from "solid-js";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
}

export const Pagination: Component<PaginationProps> = (props) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const safePage = () => Math.max(1, Math.min(props.currentPage, props.lastPage));

  const goPrev = () => {
    setSearchParams({ p: String(safePage() - 1) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    setSearchParams({ p: String(safePage() + 1) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div class="pagination">
      {safePage() !== 1 && (
        <button type="button" onClick={goPrev}>
         前に戻る
        </button>
      )}
      {safePage() !== props.lastPage && (
        <button type="button" onClick={goNext}>
          次に進む
        </button>
      )}
    </div>
  );
};
