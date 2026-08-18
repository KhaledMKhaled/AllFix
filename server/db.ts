import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { formatEgp } from "@shared/poc";
import { contracts, leads, orders, trackingEvents, users, visitors, type InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { buildDemoContractHtml } from "./poc-contract";

let _db: ReturnType<typeof drizzle> | null = null;

type DemoOrder = {
  id: number; orderId: string; visitorId: string; persona: string; customerName: string; email: string; phone: string; planSku: string; planName: string; addonSkus: string[]; billingCycle: string;
  subtotalPiastres: number; discountPiastres: number; vatPiastres: number; totalPiastres: number; status: "PENDING_DEMO" | "PAID_DEMO"; paymentTokenHash: string; paymentExpiresAt: Date; paidAt: Date | null; createdAt: Date; updatedAt: Date;
  addons?: Array<{ sku: string; name: string; quantity: number; lineTotalPiastres: number }>;
};

type DemoContract = { contractId: string; orderId: string; contractNumber: string; html: string; checksum: string; createdAt: Date };

const memoryOrders = new Map<string, DemoOrder>();
const memoryContracts = new Map<string, DemoContract>();
const memoryEvents: Array<{ eventName: string; visitorId: string; sessionId: string; pagePath: string; persona?: string | null; createdAt: Date; firstTouch?: Record<string, string> }> = [];
const memoryLeads: Array<{ contactId: string; createdAt: Date }> = [];

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: user.lastSignedIn ?? new Date(), role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user") };
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: new Date(), role: values.role } });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const newPaymentToken = () => randomBytes(32).toString("base64url");
export const formatMoney = (piastres: number) => formatEgp(piastres);

export async function recordTrackingEvent(input: { eventId: string; eventName: string; visitorId: string; sessionId: string; pagePath: string; persona?: "firm" | "company" | null; uiContext?: string; firstTouch?: Record<string, string>; lastTouch?: Record<string, string>; consentAnalytics: boolean; consentMarketing: boolean; properties?: Record<string, unknown> }) {
  memoryEvents.push({ eventName: input.eventName, visitorId: input.visitorId, sessionId: input.sessionId, pagePath: input.pagePath, persona: input.persona, createdAt: new Date(), firstTouch: input.firstTouch });
  const db = await getDb();
  if (!db) return;
  await db.insert(visitors).values({ visitorId: input.visitorId, persona: input.persona ?? null, firstTouch: input.firstTouch, lastTouch: input.lastTouch }).onDuplicateKeyUpdate({ set: { persona: input.persona ?? null, lastTouch: input.lastTouch, updatedAt: new Date() } });
  await db.insert(trackingEvents).values({ eventId: input.eventId, eventName: input.eventName, visitorId: input.visitorId, sessionId: input.sessionId, pagePath: input.pagePath, persona: input.persona ?? null, uiContext: input.uiContext ?? null, consentAnalytics: input.consentAnalytics ? 1 : 0, consentMarketing: input.consentMarketing ? 1 : 0, firstTouch: input.firstTouch, lastTouch: input.lastTouch, properties: input.properties }).onDuplicateKeyUpdate({ set: { eventId: input.eventId } });
}

export async function createLead(input: { name: string; email: string; phone?: string; visitorId: string; source: string; marketingOptIn: boolean }) {
  const contactId = `lead_${nanoid(12)}`;
  memoryLeads.push({ contactId, createdAt: new Date() });
  const db = await getDb();
  if (db) await db.insert(leads).values({ contactId, name: input.name, email: input.email, phone: input.phone ?? null, visitorId: input.visitorId, source: input.source, marketingOptIn: input.marketingOptIn ? 1 : 0 });
  return { contactId };
}

export async function createDemoOrder(input: {
  visitorId: string;
  persona: "firm" | "company";
  name: string;
  email: string;
  phone: string;
  planSku: string;
  addonSkus: string[];
  billingCycle: "annual";
  quote: {
    plan: { name: string };
    addons?: Array<{ sku: string; name: string; quantity: number; lineTotalPiastres: number }>;
    subtotalPiastres: number;
    discountPiastres: number;
    vatPiastres: number;
    totalPiastres: number;
  };
}) {
  const orderId = `ord_${nanoid(14)}`;
  const paymentToken = newPaymentToken();
  const now = new Date();
  const item: DemoOrder = {
    id: 0,
    orderId,
    visitorId: input.visitorId,
    persona: input.persona,
    customerName: input.name,
    email: input.email,
    phone: input.phone,
    planSku: input.planSku,
    planName: input.quote.plan.name,
    addonSkus: input.addonSkus,
    addons: input.quote.addons || [],
    billingCycle: input.billingCycle,
    subtotalPiastres: input.quote.subtotalPiastres,
    discountPiastres: input.quote.discountPiastres,
    vatPiastres: input.quote.vatPiastres,
    totalPiastres: input.quote.totalPiastres,
    status: "PENDING_DEMO",
    paymentTokenHash: tokenHash(paymentToken),
    paymentExpiresAt: new Date(now.getTime() + 30 * 60 * 1000),
    paidAt: null,
    createdAt: now,
    updatedAt: now,
  };
  memoryOrders.set(item.paymentTokenHash, item);
  const db = await getDb();
  if (db) {
    const { id: _id, addons: _addons, ...dbValues } = item;
    await db.insert(orders).values(dbValues);
  }
  await recordTrackingEvent({ eventId: `order_${orderId}`, eventName: "order_created", visitorId: input.visitorId, sessionId: "server", pagePath: "/checkout", persona: input.persona, consentAnalytics: false, consentMarketing: false, properties: { orderId, planSku: input.planSku } });
  return { orderId, paymentToken };
}

export async function getOrderByPaymentToken(token: string): Promise<DemoOrder | undefined> {
  const hash = tokenHash(token);
  const db = await getDb();
  if (!db) return memoryOrders.get(hash);
  const result = await db.select().from(orders).where(eq(orders.paymentTokenHash, hash)).limit(1);
  return result[0] as DemoOrder | undefined;
}

function demoFawryCode(orderId: string) {
  const digits = createHash("sha256").update(orderId).digest("hex").replace(/[^0-9]/g, "").padEnd(9, "7").slice(0, 9);
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function orderPublicView(order: DemoOrder) {
  return {
    orderId: order.orderId,
    planName: order.planName,
    billingCycle: order.billingCycle,
    subtotalPiastres: order.subtotalPiastres,
    discountPiastres: order.discountPiastres,
    vatPiastres: order.vatPiastres,
    totalPiastres: order.totalPiastres,
    status: order.status,
    expiresAt: order.paymentExpiresAt,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    persona: order.persona,
    paidAt: order.paidAt,
    fawryCode: demoFawryCode(order.orderId),
    paymentAddress: "mofawtar@instapay",
    addons: order.addons || [],
  };
}

export async function approveDemoPayment(token: string) {
  const hash = tokenHash(token);
  const order = await getOrderByPaymentToken(token);
  if (!order || order.paymentExpiresAt.getTime() < Date.now()) return undefined;
  if (order.status === "PAID_DEMO") return order;
  const now = new Date();
  const db = await getDb();
  if (db) {
    await db.update(orders).set({ status: "PAID_DEMO", paidAt: now, updatedAt: now }).where(and(eq(orders.paymentTokenHash, hash), eq(orders.status, "PENDING_DEMO")));
    const updated = await db.select().from(orders).where(eq(orders.paymentTokenHash, hash)).limit(1);
    if (!updated[0]) return undefined;
    await recordTrackingEvent({ eventId: `purchase_${updated[0].orderId}`, eventName: "purchase_completed", visitorId: updated[0].visitorId, sessionId: "server", pagePath: "/payment-processing", persona: updated[0].persona as "firm" | "company", consentAnalytics: false, consentMarketing: false, properties: { orderId: updated[0].orderId, valuePiastres: updated[0].totalPiastres } });
    return updated[0] as DemoOrder;
  }
  const updated = memoryOrders.get(hash);
  if (!updated) return undefined;
  updated.status = "PAID_DEMO"; updated.paidAt = now; updated.updatedAt = now;
  await recordTrackingEvent({ eventId: `purchase_${updated.orderId}`, eventName: "purchase_completed", visitorId: updated.visitorId, sessionId: "server", pagePath: "/payment-processing", persona: updated.persona as "firm" | "company", consentAnalytics: false, consentMarketing: false, properties: { orderId: updated.orderId, valuePiastres: updated.totalPiastres } });
  return updated;
}

export async function createContract(orderId: string, pendingHtml: string) {
  const existing = await getContractByOrderId(orderId);
  if (existing) return { contractId: existing.contractId, contractNumber: existing.contractNumber };
  const db = await getDb();
  const sequence = db ? (await db.select().from(contracts)).length + 1 : memoryContracts.size + 1;
  const contractNumber = `MOF-CON-${new Date().getUTCFullYear()}-${String(sequence).padStart(6, "0")}`;
  const html = pendingHtml.replaceAll("PENDING", contractNumber);
  const item: DemoContract = { contractId: `con_${nanoid(14)}`, orderId, contractNumber, html, checksum: createHash("sha256").update(html).digest("hex"), createdAt: new Date() };
  memoryContracts.set(orderId, item);
  if (db) await db.insert(contracts).values(item);
  return { contractId: item.contractId, contractNumber: item.contractNumber };
}

export async function getContractByOrderId(orderId: string): Promise<DemoContract | undefined> {
  const db = await getDb();
  if (!db) return memoryContracts.get(orderId);
  const result = await db.select().from(contracts).where(eq(contracts.orderId, orderId)).limit(1);
  return result[0] as DemoContract | undefined;
}

function legacyField(html: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<th>${escaped}</th><td(?: colspan="3")?>([^<]*)</td>`));
  return (match?.[1] ?? "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

async function refreshLegacyContract(order: DemoOrder, contract: DemoContract): Promise<DemoContract> {
  const html = buildDemoContractHtml(contract.contractNumber, {
    customerName: order.customerName, email: order.email, phone: order.phone,
    taxCard: legacyField(contract.html, "رقم البطاقة الضريبية"), nationalId: legacyField(contract.html, "الرقم القومي"), commercialRegister: legacyField(contract.html, "رقم السجل التجاري"), address: legacyField(contract.html, "العنوان التفصيلي"),
    planName: order.planName, packagePrice: formatMoney(order.subtotalPiastres), vat: formatMoney(order.vatPiastres), discount: formatMoney(order.discountPiastres), total: formatMoney(order.totalPiastres),
  });
  const refreshed = { ...contract, html, checksum: createHash("sha256").update(html).digest("hex") };
  memoryContracts.set(order.orderId, refreshed);
  const db = await getDb();
  if (db) await db.update(contracts).set({ html: refreshed.html, checksum: refreshed.checksum }).where(eq(contracts.orderId, contract.orderId));
  return refreshed;
}

export async function getContractByPaymentToken(token: string) {
  const order = await getOrderByPaymentToken(token);
  if (!order || order.status !== "PAID_DEMO") return undefined;
  const contract = await getContractByOrderId(order.orderId);
  if (!contract || contract.html.includes("/brand/mofawtar-official-stamp.png")) return contract;
  return refreshLegacyContract(order, contract);
}

export async function getDashboardSummary() {
  const db = await getDb();
  const eventRows = db ? await db.select().from(trackingEvents).orderBy(desc(trackingEvents.createdAt)) : memoryEvents.map((event, index) => ({ id: index, ...event }));
  const orderRows = db ? await db.select().from(orders).orderBy(desc(orders.createdAt)) : Array.from(memoryOrders.values());
  const contractRows = db ? await db.select().from(contracts) : Array.from(memoryContracts.values());
  const leadRows = db ? await db.select().from(leads) : memoryLeads;
  const unique = (name: string) => new Set(eventRows.filter(item => item.eventName === name).map(item => item.visitorId)).size;
  const sources = new Map<string, Set<string>>();
  eventRows.forEach(item => { const source = (item.firstTouch as Record<string, string> | null)?.utm_source ?? "مباشر"; const visitorsForSource = sources.get(source) ?? new Set<string>(); visitorsForSource.add(item.visitorId); sources.set(source, visitorsForSource); });
  return {
    overview: { visitors: new Set(eventRows.map(item => item.visitorId)).size, sessions: new Set(eventRows.map(item => item.sessionId)).size, leads: leadRows.length, orders: orderRows.length, paid: orderRows.filter(item => item.status === "PAID_DEMO").length, contracts: contractRows.length },
    funnel: ["page_view", "persona_resolved", "pricing_viewed", "plan_selected", "checkout_started", "order_created", "purchase_completed", "contract_generated", "contract_downloaded"].map(name => ({ name, value: unique(name) })),
    sources: Array.from(sources.entries()).map(([source, visitors]) => ({ source, value: visitors.size })).sort((a, b) => b.value - a.value).slice(0, 6),
    recentEvents: eventRows.slice(0, 12).map(item => ({ eventName: item.eventName, pagePath: item.pagePath, persona: item.persona, createdAt: item.createdAt })),
    health: { rejected: 0, duplicates: 0, missingUtmRate: eventRows.length ? Math.round((eventRows.filter(item => !(item.firstTouch as Record<string, string> | null)?.utm_source).length / eventRows.length) * 100) : 0, lastEventAt: eventRows[0]?.createdAt ?? null, analyticsStatus: "TEST" },
  };
}
