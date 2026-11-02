export const plans = {
 monthlyCents: 990,
 lifetimeUpgradeCents: 6000,
 lifetimeTotalCents: 6990,
} as const;
export const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
