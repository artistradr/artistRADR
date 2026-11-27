// Currencies and payment methods offered when paying for a campaign.
// Prices are set in USD. Paystack charges in Naira, so choosing it switches the currency to NGN.

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US dollar" },
  { code: "NGN", symbol: "₦", label: "Nigerian naira" },
];

export const METHODS = [
  {
    id: "flutterwave",
    name: "Flutterwave",
    note: "Cards, bank transfer and mobile money.",
    available: false,
    currency: null,
  },
  {
    id: "paystack",
    name: "Paystack",
    note: "Cards, bank transfer and USSD. Charged in Naira (₦).",
    available: true,
    currency: "NGN",
  },
];

export function formatMoney(amount, currency = "USD") {
  const naira = currency === "NGN";
  return new Intl.NumberFormat(naira ? "en-NG" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: naira ? 0 : 2,
    maximumFractionDigits: naira ? 0 : 2,
  }).format(Number(amount) || 0);
}

// True when the chosen method can charge in the chosen currency (today: Paystack in Naira).
export function canPay(draft, currency) {
  const method = METHODS.find((m) => m.id === draft.method);
  return Boolean(method?.available && method.currency === currency);
}
