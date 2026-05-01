const BACKEND_URL = import.meta.env.VITE_API_URL;

export function startKeepAlive() {
  // Ping setiap 4 menit (Leapcell sleep setelah ~5 menit idle)
  const interval = setInterval(async () => {
    try {
      await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
    } catch (_) {}
  }, 4 * 60 * 1000);

  return () => clearInterval(interval);
}