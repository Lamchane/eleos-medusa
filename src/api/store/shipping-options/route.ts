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

    const shipping_response = {
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
        serviceable: true,
        shipping_fee: options[0].amount,
        cod: options[0].metadata.cod,
        cod_fee: options[0].metadata.cod_fee,
      })),
    };

    console.log(shipping_response);

    return res.json(shipping_response);
  } catch (error) {
    console.log(error);

    return res.status(500).json({ error: error.message });
  }
};
