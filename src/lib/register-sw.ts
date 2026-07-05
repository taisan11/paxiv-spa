export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SW registered:", reg.scope);
          setInterval(() => reg.update(), 60 * 60 * 1000);
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    });
  }
}
