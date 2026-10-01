import express, { NextFunction, Request, Response } from "express";
import path from "path";
import supplierRoutes from "./routes/supplier.routes";
import hotelRoutes from "./routes/hotel.routes";
import { connectRedis } from "./services/redis.service";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.use(supplierRoutes);
app.use(hotelRoutes);

app.get("/health", async (_req: Request, res: Response) => {
  const baseUrl = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
  const checkSupplier = async (path: string): Promise<"UP" | "DOWN"> => {
    try {
      const response = await fetch(`${baseUrl}${path}?city=delhi`);
      return response.ok ? "UP" : "DOWN";
    } catch {
      return "DOWN";
    }
  };

  const [supplierA, supplierB] = await Promise.all([
    checkSupplier("/supplierA/hotels"),
    checkSupplier("/supplierB/hotels")
  ]);
  const healthy = supplierA === "UP" && supplierB === "UP";
  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "UP" : "DEGRADED",
    suppliers: { supplierA, supplierB }
  });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

async function startServer(): Promise<void> {
  try {
    await connectRedis();
    app.listen(PORT, () => console.log(`Hotel Offer Orchestrator running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

startServer();
