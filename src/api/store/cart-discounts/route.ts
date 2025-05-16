import {
  type MedusaRequest,
  type MedusaResponse,
  type DiscountService,
  type CartService,
  PaymentSession,
} from "@medusajs/medusa";
import { decorateCartTotals } from "@medusajs/utils";
import { EntityManager } from "typeorm";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const manager: EntityManager = req.scope.resolve("manager");
  const paymentSessionRepo = manager.getRepository(PaymentSession);

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
  let cart_id = order_id as string;

  //   const jsonSearchObject = {};
  //   jsonSearchObject["id"] = order_id;

  //   const query = paymentSessionRepo.createQueryBuilder("payment_session");

  //   query.where("payment_session.data @> :jsonSearchObject", {
  //     jsonSearchObject: JSON.stringify(jsonSearchObject),
  //   });

  //   try {
  //     const paymentSession = await query.getOneOrFail();
  //     cart_id = paymentSession.cart_id;
  //   } catch (e) {
  //     return res.status(405).json({
  //       failure_code: "INVALID_PROMOTION",
  //       failure_reason: "payment session not found",
  //     });
  //   }

  const cart = await cartService.retrieve(cart_id, {
    relations: [
      "discounts",
      "discounts.rule",
      "items",
      "items.adjustments",
      "items.variant",
      "shipping_methods",
      "region",
    ],
  });
  const discount = await discountService.retrieveByCode(code as string, {
    relations: ["rule", "regions"],
  });

  if (!discount || !cart) {
    return res.status(404).json({
      failure_code: "INVALID_PROMOTION",
      failure_reason: "discount or cart not found",
    });
  }

  try {
    await cartService.applyDiscounts(cart, [discount.code]);
    const updated_cart = await cartService.retrieve(cart.id, {
      relations: [
        "items",
        "items.adjustments",
        "shipping_methods",
        "region",
        "discounts",
      ],
    });

    const cart_with_totals = decorateCartTotals({
      ...updated_cart,
      shipping_methods: updated_cart.shipping_methods.map((method) => ({
        amount: method.total,
        ...method,
      })),
    });

    console.log(updated_cart);
    console.log(cart_with_totals);

    return res.json({
      promotion: {
        reference_id: discount.id,
        type: "coupon",
        code: discount.code,
        value: Number(cart_with_totals.discount_total ?? 0),
        value_type: discount.rule.type,
        description: discount.rule.description,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      failure_code: "INVALID_PROMOTION",
      failure_reason:
        error instanceof Error ? error.message : "Failed to apply discount",
    });
  }
};
