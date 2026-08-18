export type Persona = "firm" | "company";

export type Plan = {
  sku: string;
  persona: Persona;
  name: string;
  description: string;
  annualPiastres: number;
  files: string;
  fileCount: number;
  users: string;
  featured?: boolean;
  recommended?: boolean;
  badge?: string;
  features: string[];
  decisionCue: string;
};

export type Addon = {
  sku: string;
  name: string;
  annualPiastres: number;
  description: string;
  salesCue: string;
  persona?: Persona | "both";
  includedIn?: string[];
};

export const PLANS: Plan[] = [
  {
    sku: "founder", persona: "company", name: "باقة رواد الأعمال", description: "بداية منظمة لتتابع ملفك الضريبي دون تعقيد.", annualPiastres: 25000,
    files: "1 ملف ضريبي", fileCount: 1, users: "1 مستخدم", features: ["24 نقطة مجانية للعمليات", "فروع غير محدودة", "لوحة متابعة أساسية"], decisionCue: "ابدأ بالأساسيات، ثم أضف أدوات الإصدار عند الحاجة.",
  },
  {
    sku: "special", persona: "company", name: "الباقة الخاصة", description: "لمن يريد مسار إصدار ضريبي جاهز وقيمة أكبر من البداية.", annualPiastres: 85000,
    files: "1 ملف ضريبي", fileCount: 1, users: "2 مستخدمين", featured: true, recommended: true, badge: "الخيار الأنسب للإصدار", features: ["9600 نقطة إصدار متضمنة", "إصدار الفواتير والإيصالات", "1 جهاز POS", "فروع غير محدودة"], decisionCue: "اختيار أوفر إذا كنت ستصدر فواتير أو إيصالات بانتظام.",
  },
  {
    sku: "professional", persona: "firm", name: "باقة المحترف", description: "للمكتب الذي يبدأ في تنظيم ملفات عملائه عبر فريق صغير.", annualPiastres: 50000,
    files: "10 ملفات ضريبية", fileCount: 10, users: "2 مستخدمين", features: ["إدارة ملفات العملاء في مكان واحد", "تنزيل ومراجعة منظمة", "صلاحيات لفريق المكتب", "4.2 ج.م / ملف / شهر"], decisionCue: "انقل أول 10 ملفات من المتابعة اليدوية لمسار منظم.",
  },
  {
    sku: "expert", persona: "firm", name: "باقة الخبير", description: "سعة أكبر للمكاتب التي تتوسع في عدد العملاء والمتابعة اليومية.", annualPiastres: 100000,
    files: "25 ملفًا ضريبيًا", fileCount: 25, users: "4 مستخدمين", features: ["كل ما في المحترف", "15 ملفًا إضافيًا", "2 مستخدمين إضافيين", "3.3 ج.م / ملف / شهر"], decisionCue: "مناسبة حين يصبح توزيع المتابعة بين أكثر من محاسب ضرورة.",
  },
  {
    sku: "consultant", persona: "firm", name: "باقة الاستشاري", description: "للمكاتب ذات حجم تشغيل أكبر وإيقاع مراجعة أسرع.", annualPiastres: 180000,
    files: "50 ملفًا ضريبيًا", fileCount: 50, users: "6 مستخدمين", features: ["كل ما في الخبير", "25 ملفًا إضافيًا", "2 مستخدمين إضافيين", "3.0 ج.م / ملف / شهر"], decisionCue: "خفّف التشتت عندما يكبر عدد الملفات النشطة في المكتب.",
  },
  {
    sku: "elite", persona: "firm", name: "باقة النخبة", description: "أعلى سعة لاستيعاب محفظة عملاء واسعة وفريق أكبر.", annualPiastres: 250000,
    files: "100 ملف ضريبي", fileCount: 100, users: "10 مستخدمين", featured: true, recommended: true, badge: "أفضل قيمة للمكاتب", features: ["كل ما في الاستشاري", "50 ملفًا إضافيًا", "4 مستخدمين إضافيين", "2.1 ج.م / ملف / شهر"], decisionCue: "اخترها عندما تكون الأولوية لاستيعاب النمو دون تغيير الباقة سريعًا.",
  },
];

export const ADDONS: Addon[] = [
  {
    sku: "points", name: "حزمة الإصدار: 9600 نقطة", annualPiastres: 60000, description: "رصيد لإصدار الفواتير والإيصالات ضمن تجربة موحدة.",
    salesCue: "أضفها عندما تريد تحويل الباقة الأساسية إلى مسار إصدار عملي.", persona: "company", includedIn: ["special"],
  },
  {
    sku: "pos", name: "جهاز POS إضافي", annualPiastres: 50000, description: "جهاز إضافي لكل ملف ضريبي يحتاج نقطة بيع منفصلة.",
    salesCue: "اختره فقط عند وجود نقطة بيع أو ملف يحتاج جهازًا مستقلاً.", persona: "company",
  },
  {
    sku: "user", name: "مستخدم إضافي", annualPiastres: 5000, description: "أضف مقعدًا جديدًا بصلاحيات مستقلة لفريقك.",
    salesCue: "أفضل ترقية عندما يتوقف العمل على مشاركة حساب واحد بين أكثر من شخص.", persona: "both",
  },
];

export function getPlansForPersona(persona: Persona) {
  return PLANS.filter(plan => plan.persona === persona);
}

export function getAddonsForPersona(persona: Persona) {
  return ADDONS.filter(addon => !addon.persona || addon.persona === "both" || addon.persona === persona);
}

export function resolvePersona(value: string | null | undefined): Persona | null {
  return value === "firm" || value === "company" ? value : null;
}

export const PROMO = {
  campaignId: "august-annual-2026",
  title: "وفّر على الاشتراك السنوي قبل نهاية الشهر",
  subtitle: "اختر الباقة المناسبة اليوم، وأضف فقط ما تحتاجه للنمو.",
  deadlineIso: "2026-08-31T23:59:59+03:00",
  discountBps: 1000,
  eligibleBillingCycle: "annual" as const,
};

export const ANALYTICS_DEMO_CONFIG = {
  status: "TEST" as const,
  gtmId: "GTM-DEMO-MOFAWTAR",
  ga4Id: "G-DEMO-MOFAWTAR",
  metaPixelId: "000000000000000",
};

export type AddonQuantities = Record<string, number>;

export type QuoteAddon = Addon & {
  quantity: number;
  lineTotalPiastres: number;
};

export function parseAddonQuantities(input: string | string[] | AddonQuantities | null | undefined): AddonQuantities {
  if (!input) return {};
  if (typeof input === "string") {
    const result: AddonQuantities = {};
    input.split(",").forEach(segment => {
      const trimmed = segment.trim();
      if (!trimmed) return;
      if (trimmed.includes(":")) {
        const [sku, qtyStr] = trimmed.split(":");
        const qty = parseInt(qtyStr, 10);
        if (sku && !isNaN(qty) && qty > 0) result[sku] = Math.min(qty, 999);
      } else {
        result[trimmed] = 1;
      }
    });
    return result;
  }
  if (Array.isArray(input)) {
    const result: AddonQuantities = {};
    input.forEach(sku => {
      if (typeof sku === "string" && sku.trim()) {
        const trimmed = sku.trim();
        if (trimmed.includes(":")) {
          const [s, q] = trimmed.split(":");
          const qty = parseInt(q, 10);
          if (s && !isNaN(qty) && qty > 0) result[s] = Math.min(qty, 999);
        } else {
          result[trimmed] = (result[trimmed] || 0) + 1;
        }
      }
    });
    return result;
  }
  if (typeof input === "object") {
    const result: AddonQuantities = {};
    Object.entries(input).forEach(([sku, qty]) => {
      if (typeof qty === "number" && qty > 0) {
        result[sku] = Math.min(Math.floor(qty), 999);
      }
    });
    return result;
  }
  return {};
}

export function serializeAddonQuantities(quantities: AddonQuantities): string {
  return Object.entries(quantities)
    .filter(([, qty]) => typeof qty === "number" && qty > 0)
    .map(([sku, qty]) => (qty > 1 ? `${sku}:${qty}` : sku))
    .join(",");
}

export function isCampaignActive(now = new Date()) { return now.getTime() < new Date(PROMO.deadlineIso).getTime(); }

export function calculateQuote(
  planSku: string,
  addonInput: string[] | AddonQuantities = {},
  billingCycle: "annual" = "annual",
  now = new Date()
) {
  const plan = PLANS.find(item => item.sku === planSku);
  if (!plan) throw new Error("Unknown plan");

  const quantityMap = parseAddonQuantities(addonInput);

  const chosenAddons: QuoteAddon[] = ADDONS
    .filter(item => (quantityMap[item.sku] ?? 0) > 0 && !item.includedIn?.includes(planSku))
    .map(item => {
      const quantity = quantityMap[item.sku] || 1;
      const lineTotalPiastres = item.annualPiastres * quantity;
      return {
        ...item,
        quantity,
        lineTotalPiastres,
      };
    });

  const planPrice = plan.annualPiastres;
  const addonPrice = chosenAddons.reduce((sum, item) => sum + item.lineTotalPiastres, 0);
  const subtotalPiastres = planPrice + addonPrice;
  const discountPiastres = isCampaignActive(now) ? Math.floor((subtotalPiastres * PROMO.discountBps) / 10000) : 0;
  const taxablePiastres = subtotalPiastres - discountPiastres;
  const vatPiastres = Math.round((taxablePiastres * 14) / 100);

  return {
    plan,
    addons: chosenAddons,
    addonQuantities: quantityMap,
    billingCycle: "annual" as const,
    subtotalPiastres,
    discountPiastres,
    vatPiastres,
    totalPiastres: taxablePiastres + vatPiastres,
    campaignId: discountPiastres > 0 ? PROMO.campaignId : null,
  };
}

const egpFormatter = new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 0 });

export function formatEgp(piastres: number) {
  return `${egpFormatter.format(Math.round(piastres / 100))} ج.م`;
}
