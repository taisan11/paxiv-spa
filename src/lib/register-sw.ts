export function registerServiceWorker() {
  // Offline mode is intentionally unsupported. Existing registrations are
  // removed when this module is called by older clients.
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.getRegistrations().then((registrations) =>
    Promise.all(registrations.map((registration) => registration.unregister()))
  );
}
