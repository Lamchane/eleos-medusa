import type {
  MedusaRequest,
  MedusaResponse,
  DiscountService,
  CartService,
} from "@medusajs/medusa";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartService: CartService = req.scope.resolve("cartService");
  const discountService: DiscountService = req.scope.resolve("discountService");

  const { order_id, code } = req.body as Record<string, unknown>;

  if (!code) {
    const discounts = await discountService.list({
      is_disabled: false,
    });

    const disocount_response = {
      promotions: discounts.map((discount) => ({
        code: discount.code,
        summary: discount.metadata.summary ?? "",
        description: discount.metadata.description ?? "",
      })),
    };

    return res.json(disocount_response);
  }

  // try to apply the discount code

  const cart = await cartService.retrieve(order_id as string);
  const discount = await discountService.retrieveByCode(code as string);

  if (!discount || !cart) {
    return res.status(400).json({
      failure_code: "INVALID_PROMOTION",
      failure_reason: "Invalid discount code or cart ID",
    });
  }

  try {
    discountService.validateDiscountForCartOrThrow(cart, discount);
    cartService.applyDiscount(cart, discount.code);

    const updated_cart = await cartService.retrieve(order_id as string);

    return res.json({
      promotion: {
        reference_id: discount.id,
        type: "coupon",
        code: discount.code,
        value: updated_cart.discount_total,
        value_type: discount.rule.type,
        description: discount.rule.description,
      },
    });
  } catch (error) {
    return res.status(400).json({
      failure_code: "INVALID_PROMOTION",
      failure_reason:
        error instanceof Error ? error.message : "Failed to apply discount",
    });
  }
};
