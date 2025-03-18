import { TransactionBaseService } from "@medusajs/medusa";

import { ProductReviewRepository } from "../repositories/product-review";
import { ProductReview } from "src/models/product-review";

class ProductReviewService extends TransactionBaseService {
  protected productReviewRepository_: typeof ProductReviewRepository;

  constructor(container) {
    super(container);
    this.productReviewRepository_ = container.productReviewRepository;
  }

  // List all reviews for a specific product
  async listReviews(productId: string): Promise<ProductReview[]> {
    // @ts-ignore
    const repo = this.activeManager_.withRepository(
      this.productReviewRepository_
    );
    return await repo.find({ where: { product_id: productId } });
  }

  // List reviews with a minimum rating (using our custom repository method)
  async listHighRatedReviews(minRating: number): Promise<ProductReview[]> {
    //@ts-ignore
    const repo = this.activeManager_.withRepository(
      this.productReviewRepository_
    );
    return await repo.findByMinRating(minRating);
  }

  // Create a new review for a product
  async createReview(
    productId: string,
    data: { title: string; user_name: string; rating: number; content: string }
  ): Promise<ProductReview> {
    //@ts-ignore
    const repo = this.activeManager_.withRepository(
      this.productReviewRepository_
    );
    const review = repo.create({
      product_id: productId,
      ...data,
    });
    return await repo.save(review);
  }
}

export default ProductReviewService;
