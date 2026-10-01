import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/hotel.activities";
import { HotelOffer, SupplierHotel } from "../types/hotel";

const { fetchSupplierA, fetchSupplierB, saveHotelsToRedis } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
  retry: { maximumAttempts: 3 }
});

export async function hotelOfferWorkflow(city: string): Promise<HotelOffer[]> {
  const [supplierAHotels, supplierBHotels] = await Promise.all([
    fetchSupplierA(city),
    fetchSupplierB(city)
  ]);

  const bestOffers = new Map<string, HotelOffer>();
  processHotels(supplierAHotels, "Supplier A", bestOffers);
  processHotels(supplierBHotels, "Supplier B", bestOffers);

  const result = Array.from(bestOffers.values()).sort((a, b) => a.price - b.price);
  await saveHotelsToRedis(city, result);
  return result;
}

function processHotels(hotels: SupplierHotel[], supplier: string, bestOffers: Map<string, HotelOffer>): void {
  for (const hotel of hotels) {
    const key = hotel.name.trim().toLowerCase();
    const currentOffer = bestOffers.get(key);
    if (!currentOffer || hotel.price < currentOffer.price) {
      bestOffers.set(key, {
        name: hotel.name,
        price: hotel.price,
        supplier,
        commissionPct: hotel.commissionPct
      });
    }
  }
}
