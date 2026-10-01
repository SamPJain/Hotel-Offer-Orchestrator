import { randomUUID } from "crypto";
import { Router, Request, Response } from "express";
import { createClient } from "redis";
import { getTemporalClient } from "../services/temporal.service";
import { hotelOfferWorkflow } from "../workflows/hotel.workflow";
import { HotelOffer } from "../types/hotel";

const router = Router();

router.get("/api/hotels", async (req: Request, res: Response) => {
  try {
    const city = String(req.query.city || "").trim().toLowerCase();
    if (!city) return res.status(400).json({ message: "city query parameter is required" });

    const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;

    if (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) {
      return res.status(400).json({ message: "minPrice must be a valid positive number" });
    }
    if (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
      return res.status(400).json({ message: "maxPrice must be a valid positive number" });
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return res.status(400).json({ message: "minPrice cannot be greater than maxPrice" });
    }

    const temporalClient = await getTemporalClient();
    const hotels = await temporalClient.workflow.execute(hotelOfferWorkflow, {
      taskQueue: "hotel-offer-task-queue",
      workflowId: `hotel-${city}-${randomUUID()}`,
      args: [city]
    });

    if (minPrice === undefined && maxPrice === undefined) return res.json(hotels);

    const redisClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
    await redisClient.connect();
    try {
      const min = minPrice !== undefined ? minPrice : "-inf";
      const max = maxPrice !== undefined ? maxPrice : "+inf";
      const results = await redisClient.zRangeByScore(`hotels:${city}`, min, max);
      const filteredHotels: HotelOffer[] = results.map((hotel) => JSON.parse(hotel));
      return res.json(filteredHotels);
    } finally {
      await redisClient.quit();
    }
  } catch (error) {
    console.error("Hotel API error:", error);
    return res.status(500).json({ message: "Unable to retrieve hotel offers" });
  }
});

export default router;
