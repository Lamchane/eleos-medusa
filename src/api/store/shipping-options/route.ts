import type {
  MedusaRequest,
  MedusaResponse,
  ShippingOptionService,
} from "@medusajs/medusa";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const shippingOptionService: ShippingOptionService = req.scope.resolve(
    "shippingOptionService"
  );

  const { addresses } = req.body as unknown as {
    addresses: Record<string, any>[];
  };

  try {
    const options = await shippingOptionService.list({
      admin_only: false,
    });

    return res.json({
      addresses: addresses.map((address: any) => ({
        ...address,
        shipping_methods: options.map((option) => ({
          id: option.id,
          name: option.name,
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
