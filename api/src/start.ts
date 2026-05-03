import { buildServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";

const start = async () => {
  const app = buildServer();

  process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("[api] unhandledRejection:", reason);
  });

  process.on("uncaughtException", (err) => {
    // eslint-disable-next-line no-console
    console.error("[api] uncaughtException:", err);
  });

  // Ensures plugins (including swagger) finish registering before we start listening.
  await app.ready();

  await app.listen({ port: PORT, host: HOST });

};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[api] failed to start:", err);
  process.exit(1);
});
