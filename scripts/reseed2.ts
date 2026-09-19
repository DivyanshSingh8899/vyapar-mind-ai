// One-off reseed. Delete after use.
import { ConvexHttpClient } from "convex/browser";
import { api } from "../src/convex/_generated/api";

const client = new ConvexHttpClient("https://silent-husky-948.convex.cloud");
const r = await client.mutation(api.vyapar.reseedDemoMerchant, {});
console.log("reseeded:", r);
const dash = await client.query(api.vyapar.getDashboard, {});
if (dash) {
  console.log("today:", dash.today.totalSales, "| txns:", dash.today.txnCount, "| delta%:", dash.today.deltaPct);
}
