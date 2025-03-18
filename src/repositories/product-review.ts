import { ProductReview } from "../models/product-review";
import { dataSource } from "@medusajs/medusa/dist/loaders/database";

export const ProductReviewRepository = dataSource
  .getRepository(ProductReview)
  .extend({
    // Custom method: find reviews by a minimum rating
    async findByMinRating(minRating: number) {
      return this.find({
        where: { rating: { $gte: minRating } },
      });
    },
    // You can add more custom methods here
  });

export default ProductReviewRepository;
