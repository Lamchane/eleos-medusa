import {
  AbstractPaymentProcessor,
  Cart,
  CartService,
  CustomerService,
  isPaymentProcessorError,
  Logger,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentSessionStatus,
  ConfigModule,
} from "@medusajs/medusa";
import { EOL } from "os";
import { MedusaError } from "@medusajs/utils";

import Razorpay from "razorpay";
import { Orders } from "razorpay/dist/types/orders";
import { Payments } from "razorpay/dist/types/payments";
import { Refunds } from "razorpay/dist/types/refunds";

type ExtendedProjectConfig = ConfigModule["projectConfig"] & {
  key_id?: string;
  key_secret?: string;
  razorpay_account?: string;
  webhook_secret?: string;
  automatic_expiry_period?: number;
  manual_expiry_period?: number;
  refund_speed?: "normal" | "optimum";
  auto_capture?: boolean;
};

export interface RazorpayOptions {
  automatic_expiry_period: number;
  manual_expiry_period: number;
  refund_speed: "normal" | "optimum";
  key_secret: string | undefined;
  razorpay_account: string | undefined;
  key_id: string;
  webhook_secret: string;
  auto_capture?: boolean;
  automatic_payment_methods?: boolean;
  payment_description?: string;
}

export interface PaymentIntentOptions {
  capture_method?: "automatic" | "manual";
  setup_future_usage?: "on_session" | "off_session";
  payment_method_types?: string[];
}

export const ErrorCodes = {
  PAYMENT_INTENT_UNEXPECTED_STATE: "payment_intent_unexpected_state",
  UNSUPPORTED_OPERATION: "payment_intent_operation_unsupported",
};

export const ErrorIntentStatus = {
  SUCCEEDED: "succeeded",
  CANCELED: "canceled",
};

export const PaymentProviderKeys = {
  RAZORPAY: "razorpay",
  BAN_CONTACT: "razorpay-bancontact",
  BLIK: "razorpay-blik",
  GIROPAY: "razorpay-giropay",
  IDEAL: "razorpay-ideal",
  PRZELEWY_24: "razorpay-przelewy24",
};

class MagicCheckout extends AbstractPaymentProcessor {
  static identifier = "razorpay-magic-checkout";

  protected readonly projectConfig_: ExtendedProjectConfig;
  protected readonly options_: RazorpayOptions;
  protected razorpay_: Razorpay;

  logger: Logger;

  // customerService: CustomerService;
  cartService: CartService;

  protected constructor(container: any) {
    super(container);

    this.projectConfig_ = container.configModule["projectConfig"];
    this.options_ = {
      key_id: this.projectConfig_.key_id,
      key_secret: this.projectConfig_.key_secret,
      razorpay_account: this.projectConfig_.razorpay_account,
      auto_capture: this.projectConfig_.auto_capture,
      automatic_expiry_period: this.projectConfig_.automatic_expiry_period,
      manual_expiry_period: this.projectConfig_.manual_expiry_period,
      refund_speed: this.projectConfig_.refund_speed,
      webhook_secret: this.projectConfig_.webhook_secret,
    };
    this.logger = container.logger as Logger;
    this.cartService = container.cartService;

    this.init();
  }

  protected init(): void {
    this.razorpay_ =
      this.razorpay_ ||
      new Razorpay({
        key_id: this.options_.key_id,
        key_secret: this.options_.key_secret,
        headers: {
          "Content-Type": "application/json",
          "X-Razorpay-Account": this.options_.razorpay_account ?? undefined,
        },
      });
  }

  async getRazorpayPaymentStatus(
    paymentIntent: Orders.RazorpayOrder
  ): Promise<PaymentSessionStatus> {
    if (!paymentIntent) {
      return PaymentSessionStatus.ERROR;
    }
    return PaymentSessionStatus.AUTHORIZED;
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    const id = paymentSessionData.id as string;
    const orderId = paymentSessionData.order_id as string;
    let paymentIntent: Orders.RazorpayOrder;

    try {
      paymentIntent = await this.razorpay_.orders.fetch(id);
    } catch (e) {
      this.logger.warn("received payment data from session not order data");
      paymentIntent = await this.razorpay_.orders.fetch(orderId);
    }

    switch (paymentIntent.status) {
      // created' | 'authorized' | 'captured' | 'refunded' | 'failed'
      case "created":
        return PaymentSessionStatus.REQUIRES_MORE;

      case "paid":
        return PaymentSessionStatus.AUTHORIZED;

      case "attempted":
        return await this.getRazorpayPaymentStatus(paymentIntent);

      default:
        return PaymentSessionStatus.PENDING;
    }
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    const {
      email,
      currency_code,
      amount,
      resource_id,
      customer,
      paymentSessionData,
    } = context;

    const sessionNotes = paymentSessionData.notes as Record<string, string>;

    const { items } = await this.cartService.retrieve(resource_id, {
      relations: ["items", "items.variant"],
    });

    const intentRequest: Orders.RazorpayOrderCreateRequestBody & {
      payment_capture?: Orders.RazorpayCapturePayment;
    } = {
      amount: Math.round(amount),
      currency: currency_code.toUpperCase(),
      receipt: resource_id,
      notes: { ...sessionNotes, resource_id },
      line_items_total: Math.round(amount),
      line_items: items.map((item) => ({
        type: "",
        product_url: "",
        sku: item.variant.sku,
        variant_id: item.variant_id,
        price: item.unit_price.toString(),
        offer_price:
          item.subtotal?.toString() ??
          item.original_total?.toString() ??
          item.unit_price.toString(),
        tax_amount: item.tax_total ?? 0,
        quantity: item.quantity,
        name: item.title,
        description: item.description,
        image_url: encodeURI(item.thumbnail),
        weight: item.variant.weight?.toString(),
        dimensions: {
          length: item.variant.length?.toString(),
          width: item.variant.width?.toString(),
          height: item.variant.height?.toString(),
        },
      })),
      payment: {
        capture: this.options_.auto_capture ? "automatic" : "manual",
        capture_options: {
          refund_speed: this.options_.refund_speed ?? "normal",
          automatic_expiry_period: Math.max(
            this.options_.automatic_expiry_period ?? 20,
            12
          ),
          manual_expiry_period: Math.max(
            this.options_.manual_expiry_period ?? 10,
            7200
          ),
        },
      },
    };

    let session_data: Orders.RazorpayOrder | undefined;

    try {
      this.logger.debug(`the intent: ${JSON.stringify(intentRequest)}`);
      session_data = await this.razorpay_.orders.create(intentRequest);
    } catch (e) {
      return this.buildError(
        "An error occurred in InitiatePayment during the creation of the razorpay payment intent: " +
          JSON.stringify(e),
        e
      );
    }

    return {
      session_data: session_data ?? ({ ...context.paymentSessionData } as any),
      update_requests: customer?.metadata?.razorpay_id
        ? undefined
        : {
            customer_metadata: {
              razorpay_id: intentRequest.notes!.razorpay_id,
            },
          },
    };
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    let intent;

    try {
      const id = (paymentSessionData as unknown as Orders.RazorpayOrder)
        .id as string;

      intent = await this.razorpay_.orders.fetch(id);
    } catch (e) {
      this.buildError("An error occurred in retrievePayment", e);
    }

    return intent as unknown as PaymentProcessorSessionResponse;
    ["session_data"];
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<
    | PaymentProcessorError
    | {
        status: PaymentSessionStatus;
        data: PaymentProcessorSessionResponse["session_data"];
      }
  > {
    const status = await this.getPaymentStatus(paymentSessionData);
    return { data: paymentSessionData, status };
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    const order_id = (paymentSessionData as unknown as Orders.RazorpayOrder).id;

    const paymentsResponse = await this.razorpay_.orders.fetchPayments(
      order_id
    );

    const possibleCaptures = paymentsResponse.items?.filter(
      (item) => item.status == "authorized"
    );

    const result = possibleCaptures?.map(async (payment) => {
      const { id, amount, currency } = payment;

      const paymentIntent = await this.razorpay_.payments.capture(
        id,
        amount as string,
        currency as string
      );

      return paymentIntent;
    });

    if (result) {
      const payments = await Promise.all(result);
      const res = payments.reduce(
        (acc, curr) => ((acc[curr.id] = curr), acc),
        {}
      );
      (paymentSessionData as unknown as Orders.RazorpayOrder).payments = res;
    }

    return paymentSessionData;
  }

  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse | void> {
    // handle amount/curreny or customer details update
    // have to initiate new RP order as RP does not allow updating fields
    // other than order.notes

    return;
  }

  async updatePaymentData(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<
    PaymentProcessorSessionResponse["session_data"] | PaymentProcessorError
  > {
    try {
      // Prevent from updating the amount from here as it should go through
      // the updatePayment method to perform the correct logic
      if (data.amount || data.currency) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot update amount, use updatePayment instead"
        );
      }

      try {
        const paymentSession = await this.razorpay_.payments.fetch(
          (data.data as Record<string, any>).id as string
        );

        if (data.notes || (data.data as any)?.notes) {
          const notes = data.notes || (data.data as any)?.notes;
          const result = (await this.razorpay_.orders.edit(sessionId, {
            notes: { ...paymentSession.notes, ...notes },
          })) as unknown as PaymentProcessorSessionResponse["session_data"];
          return result;
        } else {
          this.logger.warn("only notes can be updated in razorpay order");
          return paymentSession as unknown as PaymentProcessorSessionResponse["session_data"];
        }
      } catch (e) {
        return (data as Record<string, any>).data ?? data;
      }
    } catch (e) {
      return this.buildError("An error occurred in updatePaymentData", e);
    }
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    try {
      const id = (paymentSessionData as unknown as Orders.RazorpayOrder)
        .id as string;
      const payments = await this.razorpay_.orders.fetchPayments(id);
      const payment_id = payments.items.find((p) => {
        return parseInt(`${p.amount}`.toString()) >= refundAmount;
      })?.id;

      if (payment_id) {
        const refundRequest: Refunds.RazorpayRefundCreateRequestBody = {
          amount: refundAmount,
        };
        try {
          const refundSession = await this.razorpay_.payments.refund(
            payment_id,
            refundRequest
          );
          const refundsIssued =
            paymentSessionData.refundSessions as Refunds.RazorpayRefund[];
          if (refundsIssued?.length > 0) {
            refundsIssued.push(refundSession);
          } else {
            paymentSessionData.refundSessions = [refundSession];
          }
        } catch (e) {
          return this.buildError("An error occurred in refundPayment", e);
        }
      }
      return paymentSessionData;
    } catch (error) {
      return this.buildError("An error occurred in refundPayment", error);
    }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    const error: PaymentProcessorError = {
      error: "Unable to cancel as razorpay doesn't support cancellation",
      code: ErrorCodes.UNSUPPORTED_OPERATION,
    };
    return error;
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    return await this.cancelPayment(paymentSessionData);
  }

  protected buildError(
    message: string,
    e: PaymentProcessorError | Error
  ): PaymentProcessorError {
    return {
      error: message,
      code: "code" in e ? e.code : "",
      detail: isPaymentProcessorError(e)
        ? `${e.error}${EOL}${e.detail ?? ""}`
        : "detail" in e
        ? e.detail
        : e.message ?? "",
    };
  }
}

export default MagicCheckout;
