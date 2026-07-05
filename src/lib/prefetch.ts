let observer: IntersectionObserver | null = null;

export function initIdlePrefetch() {
  if (!("requestIdleCallback" in window)) return;

  requestIdleCallback(
    () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const href = entry.target.getAttribute("href");
              if (href?.startsWith("/") && !href.includes(":")) {
                fetch(href).catch(() => {});
              }
              observer!.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "200px" }
      );

      document.querySelectorAll('a[href^="/"]').forEach((link) => {
        observer!.observe(link);
      });
    },
    { timeout: 2000 }
  );
}

export function cleanupPrefetch() {
  observer?.disconnect();
  observer = null;
}
