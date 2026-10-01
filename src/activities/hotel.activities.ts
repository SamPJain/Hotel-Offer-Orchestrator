import axios from "axios";
import { createClient } from "redis";
import { HotelOffer, SupplierHotel } from "../types/hotel";

const BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

export async function fetchSupplierA(city: string): Promise<SupplierHotel[]> {
  console.log(`Fetching Supplier A hotels for ${city}`);
  const response = await axios.get<SupplierHotel[]>(`${BASE_URL}/supplierA/hotels`, {
    params: { city },
    timeout: 5000
  });
  return response.data;
}

export async function fetchSupplierB(city: string): Promise<SupplierHotel[]> {
  console.log(`Fetching Supplier B hotels for ${city}`);
  const response = await axios.get<SupplierHotel[]>(`${BASE_URL}/supplierB/hotels`, {
    params: { city },
    timeout: 5000
  });
  return response.data;
}

export async function saveHotelsToRedis(city: string, hotels: HotelOffer[]): Promise<void> {
  const client = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
  client.on("error", (error) => console.error("Redis activity error:", error));
  await client.connect();

  try {
    const key = `hotels:${city.toLowerCase()}`;
    await client.del(key);
    if (hotels.length > 0) {
      await client.zAdd(key, hotels.map((hotel) => ({ score: hotel.price, value: JSON.stringify(hotel) })));
      await client.expire(key, 3600);
    }
  } finally {
    await client.quit();
  }
}
