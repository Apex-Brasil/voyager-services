import cron from "node-cron";

import { redisClient } from "./redisConfig";
import { cleanOldSales } from "./services/cleanoldsales";
import { fetchDataAndProcessForRanking } from "./services/rankingCollections";
import { syncAuctions } from "./services/syncauctions";
import { syncSales } from "./services/syncsales";

// run every minute
cron.schedule("* * * * *", async () => {
  console.log("running a task every 30 seconds");
  await syncSales();
  console.log("task finished");
});

// run every minute
cron.schedule("* * * * *", async () => {
  console.log("running a task every 30 seconds");
  await syncAuctions();
  console.log("task finished");
});

// run every hour one time
cron.schedule("0 */1 * * *", async () => {
  console.log("running a task every day at 00:00");
  await cleanOldSales();
  console.log("task finished");
});

redisClient
  .connect()
  .then(() => {
    // run every hour
    cron.schedule("0 * * * *", async () => {
      console.log("Iniciando atualização dos dados das coleções...");
      await fetchDataAndProcessForRanking();
      console.log("Dados das coleções atualizados com sucesso!");
    });
  })
  .catch((error: any) => {
    console.log(error);
  });
