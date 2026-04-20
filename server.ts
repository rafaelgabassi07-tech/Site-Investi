import { createServer } from "./api/app.ts";

createServer().then(({ app, PORT }) => {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Entry point server.ts running on http://localhost:${PORT}`);
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`[SERVER FATAL] Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      console.error('[SERVER ERROR]', e);
    }
  });
}).catch(err => {
  console.error("[SERVER] Failed to start:", err);
  process.exit(1);
});
