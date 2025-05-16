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

    console.log("addresess from rzp: ", addresses);
    console.log("options: ", options);

    const shipping_response = {
      addresses: addresses.map((address) => ({
        ...address,
        shipping_methods: options.map((option) => ({
          id: option.id,
          description: "Free Shipping",
          name: option.name,
          serviceable: true,
          shipping_fee: option.amount,
          cod: option.metadata.cod === "true",
          cod_fee: Number(option.metadata.cod_fee ?? 0),
        })),
      })),
    };

    console.log("response: ", JSON.stringify(shipping_response));

    return res.json(shipping_response);
  } catch (error) {
    console.log(error);

    return res.status(500).json({ error: error.message });
  }
};
