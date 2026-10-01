import { Router, Request, Response } from "express";
import { supplierAHotels, supplierBHotels } from "../data/suppliers";

const router = Router();

router.get("/supplierA/hotels", (req: Request, res: Response) => {
  const city = String(req.query.city || "").trim().toLowerCase();
  res.json(supplierAHotels.filter((hotel) => hotel.city.toLowerCase() === city));
});

router.get("/supplierB/hotels", (req: Request, res: Response) => {
  const city = String(req.query.city || "").trim().toLowerCase();
  res.json(supplierBHotels.filter((hotel) => hotel.city.toLowerCase() === city));
});

export default router;
