import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import ProductReviewService from "src/services/product-review";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productReviewService: ProductReviewService = req.scope.resolve(
    "productReviewService"
  );
  const { id: productId } = req.params;
  try {
    // Use the service to fetch reviews (e.g. with filtering, pagination, etc.)
    const reviews = await productReviewService.listReviews(productId);
    return res.json({ reviews });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const productReviewService = req.scope.resolve("productReviewService");
  const { id: productId } = req.params;
  try {
    const review = await productReviewService.createReview(productId, req.body);
    return res.json({ review });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
