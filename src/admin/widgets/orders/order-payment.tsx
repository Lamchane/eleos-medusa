import type { WidgetConfig, OrderDetailsWidgetProps } from "@medusajs/admin";
import { formatAmount, useAdminCustomQuery, useAdminOrder } from "medusa-react";

import { Badge, Container } from "@medusajs/ui";
import { StarSolid } from "@medusajs/icons";

// type RequestQuery = {};

// type ResponseData = {
//   reviews: ProductReview[];
// };

const OrderPaymentWidget = ({ order, notify }: OrderDetailsWidgetProps) => {
  const amount_due = Number(order.payments[0].data["amount_due"] ?? 0);
  const is_cod = amount_due > 0;
  const cod_fee = Number(order.payments[0].data["cod_fee"]) / 100;

  return (
    <Container className={"text-ui-fg-subtle p-4 flex gap-4"}>
      <Badge color="green">{is_cod ? "COD" : "Prepaid"}</Badge>

      <Badge>
        COD Fee:{" "}
        {cod_fee.toLocaleString("en-US", {
          style: "currency",
          currency: "inr",
        })}
      </Badge>

      {amount_due > 0 && (
        <Badge>
          Amount Due:{" "}
          {amount_due.toLocaleString("en-US", {
            style: "currency",
            currency: "inr",
          })}
        </Badge>
      )}
    </Container>
  );
};

export const config: WidgetConfig = {
  zone: "order.details.before",
};

export default OrderPaymentWidget;
