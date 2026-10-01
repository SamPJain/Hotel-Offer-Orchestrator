import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities/hotel.activities";

async function run(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || "localhost:7233"
  });

  const worker = await Worker.create({
    connection,
    namespace: "default",
    taskQueue: "hotel-offer-task-queue",
    workflowsPath: require.resolve("./workflows/hotel.workflow"),
    activities
  });

  console.log("Temporal worker started on hotel-offer-task-queue");
  await worker.run();
}

run().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
