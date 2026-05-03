import { buildServer } from "../src/server.js";

const app = buildServer();
await app.ready();

// eslint-disable-next-line no-console
console.log("swagger paths count:", Object.keys((app.swagger() as any).paths ?? {}).length);
// eslint-disable-next-line no-console
console.log(Object.keys((app.swagger() as any).paths ?? {}));

await app.close();
