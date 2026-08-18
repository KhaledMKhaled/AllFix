import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ADDONS, ANALYTICS_DEMO_CONFIG, calculateQuote, PLANS, PROMO } from "@shared/poc";
import * as db from "./db";
import { buildDemoContractHtml, checksumHtml, type ContractDetails } from "./poc-contract";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const touchSchema = z.record(z.string(), z.string()).optional();
const eventSchema = z.object({
  eventId: z.string().min(8).max(100), eventName: z.string().min(2).max(80), visitorId: z.string().min(8).max(100), sessionId: z.string().min(8).max(100),
  pagePath: z.string().min(1).max(250), persona: z.enum(["firm", "company"]).nullable().optional(), uiContext: z.string().max(120).optional(),
  firstTouch: touchSchema, lastTouch: touchSchema, consentAnalytics: z.boolean(), consentMarketing: z.boolean(), properties: z.record(z.string(), z.unknown()).optional(),
});

const contractSchema = z.object({ customerName: z.string().min(2).max(160), taxCard: z.string().max(80).optional(), nationalId: z.string().max(80).optional(), commercialRegister: z.string().max(80).optional(), address: z.string().max(400).optional(), email: z.string().email().max(320), phone: z.string().min(6).max(30) });

export const pocRouter = router({
  config: publicProcedure.query(() => ({ plans: PLANS, addons: ADDONS, promo: PROMO, analytics: ANALYTICS_DEMO_CONFIG })),
  quote: publicProcedure
    .input(
      z.object({
        planSku: z.string(),
        addonSkus: z.array(z.string()).max(8).optional(),
        addonQuantities: z.record(z.string(), z.number().int().min(0).max(999)).optional(),
        billingCycle: z.enum(["annual"]).default("annual").optional(),
      })
    )
    .query(({ input }) =>
      calculateQuote(input.planSku, input.addonQuantities || input.addonSkus || {}, "annual")
    ),
  track: publicProcedure.input(eventSchema).mutation(async ({ input }) => {
    await db.recordTrackingEvent(input);
    return { accepted: true };
  }),
  createLead: publicProcedure.input(z.object({ name: z.string().min(2).max(120), email: z.string().email().max(320), phone: z.string().max(30).optional(), visitorId: z.string().min(8), source: z.string().min(2).max(80), marketingOptIn: z.boolean() })).mutation(async ({ input }) => {
    const lead = await db.createLead(input);
    return { contactId: lead.contactId, downloadUrl: "/lead-magnet-demo" };
  }),
  createOrder: publicProcedure
    .input(
      z.object({
        visitorId: z.string().min(8),
        persona: z.enum(["firm", "company"]),
        name: z.string().min(2).max(120),
        email: z.string().email().max(320),
        phone: z.string().min(6).max(30),
        planSku: z.string(),
        addonSkus: z.array(z.string()).max(8).optional(),
        addonQuantities: z.record(z.string(), z.number().int().min(0).max(999)).optional(),
        billingCycle: z.enum(["annual"]).default("annual").optional(),
      })
    )
    .mutation(async ({ input }) => {
      let quote;
      try {
        quote = calculateQuote(
          input.planSku,
          input.addonQuantities || input.addonSkus || {},
          "annual"
        );
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "الباقة المختارة غير متاحة." });
      }
      const order = await db.createDemoOrder({
        ...input,
        addonSkus: Object.keys(quote.addonQuantities).filter(k => (quote.addonQuantities[k] ?? 0) > 0),
        billingCycle: "annual",
        quote,
      });
      return { orderId: order.orderId, paymentToken: order.paymentToken, quote };
    }),
  getPaymentSession: publicProcedure.input(z.object({ token: z.string().min(20) })).query(async ({ input }) => {
    const order = await db.getOrderByPaymentToken(input.token);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "رابط الدفع غير صالح أو انتهت صلاحيته." });
    return db.orderPublicView(order);
  }),
  approveDemoPayment: publicProcedure.input(z.object({ token: z.string().min(20) })).mutation(async ({ input }) => {
    const order = await db.approveDemoPayment(input.token);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "تعذر اعتماد عملية الدفع التجريبية." });
    return { orderId: order.orderId, status: order.status, paymentToken: input.token };
  }),
  getOrder: publicProcedure.input(z.object({ token: z.string().min(20) })).query(async ({ input }) => {
    const order = await db.getOrderByPaymentToken(input.token);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود." });
    return db.orderPublicView(order);
  }),
  createContract: publicProcedure.input(z.object({ token: z.string().min(20), details: contractSchema })).mutation(async ({ input }) => {
    const order = await db.getOrderByPaymentToken(input.token);
    if (!order || order.status !== "PAID_DEMO") throw new TRPCError({ code: "FORBIDDEN", message: "العقد متاح بعد اعتماد الدفع التجريبي فقط." });
    const quote = { planName: order.planName, packagePrice: order.subtotalPiastres, vat: order.vatPiastres, discount: order.discountPiastres, total: order.totalPiastres };
    const html = buildDemoContractHtml("PENDING", {
      ...input.details,
      planName: quote.planName,
      packagePrice: db.formatMoney(quote.packagePrice),
      vat: db.formatMoney(quote.vat),
      discount: db.formatMoney(quote.discount),
      total: db.formatMoney(quote.total),
      addons: order.addons,
    } satisfies ContractDetails);
    const contract = await db.createContract(order.orderId, html);
    await db.recordTrackingEvent({ eventId: `contract_${contract.contractId}`, eventName: "contract_generated", visitorId: order.visitorId, sessionId: "server", pagePath: "/contract", persona: order.persona as "firm" | "company", consentAnalytics: false, consentMarketing: false, properties: { orderId: order.orderId, contractNumber: contract.contractNumber, supportCopy: "queued_demo_only", recipient: "Support@mofawter.com" } });
    return { ...contract, supportCopy: "queued_demo_only" as const };
  }),
  getContract: publicProcedure.input(z.object({ token: z.string().min(20) })).query(async ({ input }) => {
    return (await db.getContractByPaymentToken(input.token)) ?? null;
  }),
  dashboard: publicProcedure.query(() => db.getDashboardSummary()),
});
