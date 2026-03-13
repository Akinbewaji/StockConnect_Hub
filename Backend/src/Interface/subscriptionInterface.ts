 interface PaymentPlan {
  planName: string;
  interval: "weekly" | "monthly" | "annually";
  amount: number;
  description?: string;
  sendSms: boolean;
  sendInvoice: boolean;
}

export default PaymentPlan