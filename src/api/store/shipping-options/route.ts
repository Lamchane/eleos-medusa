import type {
  MedusaRequest,
  MedusaResponse,
  ShippingOptionService,
} from "@medusajs/medusa";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const shippingOptionService: ShippingOptionService = req.scope.resolve(
    "shippingOptionService"
  );

  console.log(req.body);

  const { addresses } = req.body as unknown as {
    addresses: Record<string, any>[];
  };

  try {
    const options = await shippingOptionService.list({
      admin_only: false,
    });

    console.log("addresess from rzp:", addresses);

    res.json({
      addresses: [
        {
          id: "0",
          zipcode: "560000",
          state_code: "KA",
          country: "IN",
          shipping_methods: [
            {
              id: "1",
              description: "Free shipping",
              name: "Delivery within 5 days",
              serviceable: true,
              shipping_fee: 1000, // in paise. Here 1000 = 1000 paise, which equals to ₹10
              cod: true,
              cod_fee: 1000, // in paise. Here 1000 = 1000 paise, which equals to ₹10
            },
            {
              id: "2",
              description: "Standard Delivery",
              name: "Delivered on the same day",
              serviceable: true,
              shipping_fee: 1000, // in paise. Here 1000 = 1000 paise, which equals to ₹10
              cod: false,
              cod_fee: 0, // in paise. Here 1000 = 1000 paise, which equals to ₹10
            },
          ],
        },
      ],
    });

    return res.json({
      addresses: addresses.map((address) => ({
        ...address,
        shipping_methods: options.map((option) => ({
          id: option.id,
          name: option.name,
          description: "Free Shipping",
          serviceable: true,
          shipping_fee: option.amount,
          cod: option.metadata.cod,
          cod_fee: option.metadata.cod_fee,
        })),
      })),
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({ error: error.message });
  }
};
