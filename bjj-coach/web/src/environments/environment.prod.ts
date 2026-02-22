export const environment = {
  production: true,
  // Vercel rewrites /api/* to your Railway backend — so this stays relative
  apiUrl: '/api',
  // Vercel can't proxy WebSockets — point directly to your Railway backend
  // Replace with your actual Railway URL, e.g. 'wss://bjj-coach-production.up.railway.app/ws'
  wsUrl: 'wss://ottercoachai-production.up.railway.app/ws',
};
