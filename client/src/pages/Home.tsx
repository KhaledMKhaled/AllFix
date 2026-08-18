import core from "@/content/poc.ar.json";
import sales from "@/content/sales.ar.json";
import layout from "@/content/layout.ar.json";
import claims from "@/content/claims.ar.json";
import { getPocContext, usePocTracking } from "@/hooks/usePocTracking";
import { trpc } from "@/lib/trpc";
import { ADDONS, calculateQuote, formatEgp, getPlansForPersona, isCampaignActive, PROMO, resolvePersona, serializeAddonQuantities, type AddonQuantities, type Persona, type Plan } from "@shared/poc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronDown,
  Check,
  Clock3,
  FileDown,
  MessageCircle,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
  Zap,
  FolderKanban,
  Layers3,
  ListChecks,
  ArrowLeft,
  Play,
  Volume2,
  Building2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Calculator,
  Percent,
  CheckCircle2,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  BadgePercent,
  Lock,
  Star,
  Award,
  Search,
  ArrowUpRight,
  Plus,
  Minus,
  Trash2
} from "lucide-react";
import { FormEvent, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

type Consent = { analytics: boolean; marketing: boolean };
const VERIFIED_WHATSAPP_PHONE = "201050996319";
const WHATSAPP_URL = `https://wa.me/${VERIFIED_WHATSAPP_PHONE}?text=${encodeURIComponent("مرحبًا، أريد مساعدة لاختيار باقة موفوتر المناسبة لحجم شغلي.")}`;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function readConsent(): Consent | null {
  try {
    return JSON.parse(localStorage.getItem("mof_consent") ?? "null");
  } catch {
    return null;
  }
}

function timeLeft(now: number) {
  const value = Math.max(0, new Date(PROMO.deadlineIso).getTime() - now);
  const days = Math.floor(value / 86400000);
  const hours = String(Math.floor((value % 86400000) / 3600000)).padStart(2, "0");
  const minutes = String(Math.floor((value % 3600000) / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((value % 60000) / 1000)).padStart(2, "0");
  return `${days} يوم · ${hours}:${minutes}:${seconds}`;
}

// ---------------------------------------------------------------------------
// 1. Interactive Tax & Invoicing Simulator
// ---------------------------------------------------------------------------
function TaxInvoicingSimulator({ persona, onSelectPlan }: { persona: Persona; onSelectPlan: (sku: string) => void }) {
  const [monthlySales, setMonthlySales] = useState<number>(persona === "firm" ? 250000 : 80000);
  const [invoiceCount, setInvoiceCount] = useState<number>(persona === "firm" ? 45 : 15);
  const [whtRate, setWhtRate] = useState<number>(1); // 1%, 3%, 5%
  const [includeVat, setIncludeVat] = useState<boolean>(true);

  // Computations
  const vatAmount = includeVat ? Math.round(monthlySales * 0.14) : 0;
  const whtAmount = Math.round((monthlySales * whtRate) / 100);
  const totalTaxMonthly = vatAmount + whtAmount;
  const estimatedHoursSaved = Math.max(4, Math.round(invoiceCount * 0.45 + (persona === "firm" ? 12 : 5)));
  const estimatedCostSaved = Math.round(estimatedHoursSaved * 120);

  // Recommended plan based on inputs
  const recommendedSku = useMemo(() => {
    if (persona === "firm") {
      if (invoiceCount <= 20) return "professional";
      if (invoiceCount <= 50) return "expert";
      if (invoiceCount <= 100) return "consultant";
      return "elite";
    } else {
      return invoiceCount > 25 ? "special" : "founder";
    }
  }, [persona, invoiceCount]);

  return (
    <section id="tax-simulator" className="mof-section relative overflow-hidden bg-gradient-to-b from-[#F3F4FB] via-white to-[#F3F4FB]">
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#4046B5]/20 bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#4046B5] shadow-xs">
            <Calculator className="h-4 w-4 text-[#4046B5]" />
            حاسبة التوفير والضرائب التفاعلية
          </div>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#07081A] md:text-5xl">
            احسب توفيرك الشهري وضريبتك في ثوانٍ معدودة!
          </h2>
          <p className="mt-4 text-base leading-8 text-[#5b5c72] md:text-lg">
            حرّك المؤشرات وشوف بنفسك إزاي موفوتر بيوفّر على مكتبك أو شركتك ساعات شغل مرهقة ويحميك من أخطاء الحسابات وغرامات التأخير.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          {/* Controls Box */}
          <div className="rounded-[2.2rem] border border-[#4046B5]/15 bg-white p-6 md:p-8 shadow-[0_25px_60px_-30px_rgba(64,70,181,0.15)]">
            <h3 className="flex items-center gap-2 text-xl font-extrabold text-[#07081A]">
              <Percent className="h-5 w-5 text-[#4046B5]" />
              بيانات نشاطك التقديرية
            </h3>

            {/* Slider 1: Monthly Sales */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-[#5b5c72]">إجمالي حجم التعاملات أو المبيعات الشهرية:</span>
                <span className="font-[Inter] text-lg font-extrabold text-[#4046B5]" dir="ltr">
                  {monthlySales.toLocaleString("en-US")} ج.م
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="1000000"
                step="10000"
                value={monthlySales}
                onChange={(e) => setMonthlySales(Number(e.target.value))}
                className="mt-3 h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#ECECF7] accent-[#4046B5]"
              />
              <div className="mt-1 flex justify-between text-[11px] text-[#8e90a8]">
                <span>10 آلاف ج.م</span>
                <span>500 ألف ج.م</span>
                <span>مليون ج.م</span>
              </div>
            </div>

            {/* Slider 2: Invoice Count */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-[#5b5c72]">متوسط عدد الفواتير أو الإيصالات شهريًا:</span>
                <span className="font-[Inter] text-lg font-extrabold text-[#4046B5]">
                  {invoiceCount} مستند
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={invoiceCount}
                onChange={(e) => setInvoiceCount(Number(e.target.value))}
                className="mt-3 h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#ECECF7] accent-[#4046B5]"
              />
              <div className="mt-1 flex justify-between text-[11px] text-[#8e90a8]">
                <span>5 مستندات</span>
                <span>100 مستند</span>
                <span>200+ مستند</span>
              </div>
            </div>

            {/* Tax Settings */}
            <div className="mt-7 border-t border-[#4046B5]/10 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#07081A]">
                  <Checkbox checked={includeVat} onCheckedChange={(val) => setIncludeVat(Boolean(val))} />
                  حساب ضريبة القيمة المضافة VAT (14%)
                </label>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-[#5b5c72]">ضريبة الخصم (نموذج 41):</span>
                  <div className="flex rounded-lg bg-[#ECECF7] p-0.5">
                    {[1, 3, 5].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setWhtRate(rate)}
                        className={`rounded-md px-2.5 py-1 transition ${whtRate === rate ? "bg-[#4046B5] text-white shadow-xs" : "text-[#5b5c72] hover:text-[#4046B5]"}`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#07081A] p-7 text-white shadow-2xl">
            <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-[#4046B5]/30 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="mof-stamp-white px-3 py-1 text-xs">تقرير الحسبة التقديرية</span>
                <span className="text-xs font-bold text-[#b9bdff]">مصلحة الضرائب ETA</span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4">
                  <p className="text-xs font-bold text-white/60">ضريبة القيمة المضافة (14%)</p>
                  <p className="mt-2 font-[Inter] text-xl font-extrabold text-[#7d82eb]" dir="ltr">
                    {vatAmount.toLocaleString("en-US")} ج.م
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4">
                  <p className="text-xs font-bold text-white/60">خصم المنبع (نموذج 41)</p>
                  <p className="mt-2 font-[Inter] text-xl font-extrabold text-[#7d82eb]" dir="ltr">
                    {whtAmount.toLocaleString("en-US")} ج.م
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#4046B5] to-[#272d82] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white/80">الوقت التقديري المُوفَّر شهريًا</p>
                    <p className="mt-1 text-2xl font-extrabold text-white">
                      {estimatedHoursSaved} ساعة عمل
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#b9bdff]">قيمة التوفير المباشر</p>
                    <p className="mt-1 font-[Inter] text-xl font-extrabold text-[#38ef7d]" dir="ltr">
                      ~ {estimatedCostSaved.toLocaleString("en-US")} ج.م
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#b9bdff]">الباقة الأنسب لحجم هذا النشاط:</span>
                    <p className="mt-1 text-base font-extrabold text-white">
                      {persona === "firm"
                        ? recommendedSku === "professional" ? "باقة المحترف (10 ملفات)"
                        : recommendedSku === "expert" ? "باقة الخبير (25 ملف)"
                        : recommendedSku === "consultant" ? "باقة الاستشاري (50 ملف)"
                        : "باقة النخبة (100 ملف)"
                        : recommendedSku === "special" ? "الباقة الخاصة (إصدار متكامل)" : "باقة رواد الأعمال"}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      onSelectPlan(recommendedSku);
                      scrollToId("pricing");
                    }}
                    className="rounded-xl bg-white text-xs font-extrabold text-[#4046B5] hover:bg-[#ECECF7]"
                  >
                    اختر هذه الباقة
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Product Capabilities Section
// ---------------------------------------------------------------------------
function ProductCapabilities({
  sectionRef,
  onAction,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  onAction: (id: string, status: string) => void;
}) {
  return (
    <section ref={sectionRef} id="capabilities" className="mof-section bg-[#F6F6FF]">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mof-eyebrow">{layout.capabilities.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#07081A] md:text-5xl">
            {layout.capabilities.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-[#5b5c72] md:text-lg">
            منظومة موحدة تجمع كل ما تحتاجه للتعامل مع منظومة الفاتورة والإيصال الإلكتروني بدون تشتت بين برامج متعددة.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {layout.capabilities.items.map((item, index) => {
            const claim = claims.capabilities[item.id as keyof typeof claims.capabilities];
            const isComing = item.status === "coming";
            const isSpecial = item.status === "special";
            const actionLabel = isComing
              ? layout.capabilities.waitlist
              : isSpecial
              ? "شاهد الباقة الخاصة"
              : "شاهد تفاصيل الباقة";

            return (
              <article
                key={item.id}
                className={`relative overflow-hidden rounded-[2rem] border p-7 transition-all duration-300 hover:-translate-y-1 ${
                  isComing
                    ? "border-[#e6b75b]/40 bg-[#fffdf7]"
                    : isSpecial
                    ? "border-[#4046B5]/30 bg-[#07081A] text-white shadow-xl"
                    : "border-[#4046B5]/15 bg-white shadow-sm hover:shadow-md"
                }`}
              >
                <div className="relative flex items-start justify-between gap-5">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ${
                        isComing
                          ? "bg-[#f3b750]/20 text-[#986408]"
                          : isSpecial
                          ? "bg-white/15 text-white"
                          : "bg-[#ECECF7] text-[#4046B5]"
                      }`}
                    >
                      {item.badge}
                    </span>
                    <p className={`mt-4 text-xs font-extrabold ${isSpecial ? "text-[#c6c8ff]" : "text-[#4046B5]"}`}>
                      {item.name}
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold leading-tight">{item.title}</h3>
                  </div>
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                      isComing
                        ? "bg-[#f3b750]/15 text-[#b47a10]"
                        : isSpecial
                        ? "bg-white/10 text-[#d7d8ff]"
                        : "bg-[#ECECF7] text-[#4046B5]"
                    }`}
                  >
                    {isComing ? (
                      <Clock3 className="h-6 w-6" />
                    ) : index === 0 ? (
                      <FileSpreadsheet className="h-6 w-6" />
                    ) : (
                      <Zap className="h-6 w-6" />
                    )}
                  </span>
                </div>

                <p className={`relative mt-5 text-sm leading-7 ${isSpecial ? "text-white/75" : "text-[#5b5c72]"}`}>
                  {claim.body}
                </p>

                <div
                  className={`relative mt-6 flex items-center justify-between gap-4 border-t pt-5 ${
                    isSpecial ? "border-white/10" : "border-[#4046B5]/10"
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isSpecial ? "text-[#c6c8ff]" : isComing ? "text-[#986408]" : "text-[#4046B5]"
                    }`}
                  >
                    {item.plan}
                  </span>
                  <Button
                    variant={isSpecial ? "outline" : "default"}
                    onClick={() => onAction(item.id, item.status)}
                    className={`rounded-xl ${
                      isSpecial
                        ? "border-white/25 bg-transparent text-white hover:bg-white hover:text-[#4046B5]"
                        : isComing
                        ? "bg-[#07081A] hover:bg-[#28294b]"
                        : "bg-[#4046B5] hover:bg-[#343aa0]"
                    }`}
                  >
                    {actionLabel}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Issuance & Follow-up Section
// ---------------------------------------------------------------------------
function IssuanceFollowUp({
  onAction,
  onDocumentClick,
}: {
  onAction: (id: string, status: string) => void;
  onDocumentClick: (documentId: string) => void;
}) {
  const issuance = claims.issuance;
  const toneClasses: Record<string, string> = {
    success: "bg-[#e4f8f0] text-[#1b875e]",
    warning: "bg-[#fff2d7] text-[#a86d07]",
    scheduled: "bg-[#ECECF7] text-[#4046B5]",
    neutral: "bg-[#f0f1f5] text-[#5b5c72]",
  };

  return (
    <section id="issuance" className="mof-section bg-[#07081A] text-white">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8e93f4]/35 bg-[#4046B5]/25 px-3.5 py-1.5 text-xs font-bold text-[#d8daff]">
              <ShieldCheck className="h-4 w-4 text-[#38ef7d]" />
              {issuance.compliance}
            </div>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">{issuance.title}</h2>
            <p className="mt-5 text-base leading-8 text-white/75">{issuance.body}</p>

            <div className="mt-7 space-y-3">
              {issuance.benefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 text-sm leading-7 text-white/85">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#4046B5] text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>

            <Button
              onClick={() => onAction("sender_details", "special")}
              className="mt-8 h-12 rounded-xl bg-white px-6 font-extrabold text-[#4046B5] hover:bg-[#ECECF7]"
            >
              شاهد تفاصيل ETA Portal Sender
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/[.04] p-5 shadow-2xl">
            <div className="rounded-[1.6rem] border border-white/10 bg-[#101132] p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f3b750]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6d72db]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#38c99b]" />
                </div>
                <span className="mof-stamp-white px-2.5 py-0.5 text-[11px]">متابعة فواتير وإيصالات ETA</span>
              </div>

              <p className="mt-4 text-[11px] leading-5 text-white/45">
                حالات توضيحية تحاكي ربط المستندات مع مصلحة الضرائب المصرية لحظة بلحظة.
              </p>

              <div className="mt-4 space-y-2.5">
                {issuance.documents.map((document) => (
                  <button
                    key={document.id}
                    onClick={() => onDocumentClick(document.id)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/[.045] p-4 text-right transition hover:bg-white/[.09] active:scale-[.99]"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-white">{document.name}</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/55">{document.detail}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold ${toneClasses[document.tone]}`}>
                      {document.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Hero Section with Persona Switcher
// ---------------------------------------------------------------------------
function PersonaHero({
  persona,
  onSwitchPersona,
  onPrimary,
  onSecondary,
  showPersonaSwitcher = true,
}: {
  persona: Persona;
  onSwitchPersona?: (value: Persona) => void;
  onPrimary: () => void;
  onSecondary: () => void;
  showPersonaSwitcher?: boolean;
}) {
  const content = sales[persona];
  const visual = content.visual;
  const isFirm = persona === "firm";

  return (
    <section className="mof-grid relative overflow-hidden pt-6 pb-16 md:pt-10 md:pb-24">
      <div className="mof-orbit absolute -right-28 top-14 h-96 w-96 rounded-full bg-[#4046B5]/12 blur-3xl" />
      <div className="mof-orbit absolute -left-20 bottom-10 h-80 w-80 rounded-full bg-[#7D82EB]/10 blur-3xl" />

      <div className="container relative z-10">
        {/* Persona Switcher Bar */}
        {showPersonaSwitcher && onSwitchPersona ? <div className="mx-auto mb-8 flex max-w-md items-center justify-center rounded-2xl border border-[#4046B5]/15 bg-white/90 p-1.5 shadow-sm backdrop-blur-md">
          <button
            onClick={() => onSwitchPersona("firm")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all duration-200 ${
              isFirm
                ? "bg-[#4046B5] text-white shadow-md shadow-[#4046B5]/25"
                : "text-[#5b5c72] hover:text-[#4046B5]"
            }`}
          >
            <UsersRound className="h-4 w-4" />
            لمكاتب المحاسبة (سعات متعددة)
          </button>
          <button
            onClick={() => onSwitchPersona("company")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition-all duration-200 ${
              !isFirm
                ? "bg-[#4046B5] text-white shadow-md shadow-[#4046B5]/25"
                : "text-[#5b5c72] hover:text-[#4046B5]"
            }`}
          >
            <Building2 className="h-4 w-4" />
            للشركات والمحاسب المستقل
          </button>
        </div> : null}

        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="mof-reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4046B5]/20 bg-[#ECECF7] px-3.5 py-1.5 text-xs font-extrabold text-[#4046B5]">
              <Sparkles className="h-4 w-4 text-[#4046B5]" />
              {content.eyebrow}
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.2] tracking-tight text-[#07081A] md:text-6xl">
              {content.title}
            </h1>

            <p className="mt-6 text-base leading-8 text-[#54556d] md:text-lg">
              {content.body}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {content.proof.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2.5 rounded-2xl border border-[#4046B5]/10 bg-white/90 p-3.5 text-xs font-bold leading-6 text-[#07081A] shadow-xs backdrop-blur-xs"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#ECECF7] text-[#4046B5]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                onClick={onPrimary}
                className="h-14 rounded-2xl bg-[#4046B5] px-8 text-base font-extrabold shadow-lg shadow-[#4046B5]/30 transition-all hover:bg-[#343aa0] hover:scale-105 active:scale-95"
              >
                {content.primary}
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={onSecondary}
                className="h-14 rounded-2xl border-[#4046B5]/25 bg-white px-7 text-sm font-extrabold text-[#4046B5] hover:bg-[#ECECF7]"
              >
                {content.secondary}
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs font-bold text-[#64657a]">
              <span className="flex items-center gap-1 text-[#10B981]">
                <ShieldCheck className="h-4 w-4" />
                ضمان 14 يوم استرجاع
              </span>
              <span className="h-3 w-px bg-[#4046B5]/20" />
              <span>معتمد لمصلحة الضرائب المصرية ETA</span>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="relative mx-auto w-full max-w-lg mof-reveal" style={{ animationDelay: "100ms" }}>
            <div className="absolute -inset-4 rounded-[3rem] bg-[#4046B5]/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2.2rem] border border-white bg-[#07081A] p-3 shadow-[0_35px_80px_-30px_#07081A]">
              <div className="rounded-[1.6rem] border border-white/10 bg-[#101132] p-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#d7d8ff]">
                    {visual.label}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  {visual.stats.map((stat, idx) => (
                    <div
                      key={stat.label}
                      className={`rounded-xl p-3 text-center ${
                        idx === 1 ? "bg-[#4046B5]" : "bg-white/[.06]"
                      }`}
                    >
                      <p className="text-[10px] font-bold text-white/60">{stat.label}</p>
                      <p className="mt-1 text-xs font-extrabold leading-5">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-xs font-extrabold">{visual.title}</span>
                    <ListChecks className="h-4 w-4 text-[#b9bdff]" />
                  </div>
                  <div className="mt-2 space-y-2">
                    {visual.rows.map((row, idx) => (
                      <div
                        key={row.name}
                        className="flex items-center justify-between rounded-xl bg-white/[.05] px-3 py-2.5"
                      >
                        <span className="text-xs font-bold">{row.name}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            idx === 1 ? "bg-[#10B981]/20 text-[#38ef7d]" : "bg-[#4046B5]/30 text-[#c6c8ff]"
                          }`}
                        >
                          {row.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-xs text-white/70">
                  <FolderKanban className="h-4 w-4 text-[#aeb2ff]" />
                  <span>{visual.footer}</span>
                </div>
              </div>

              <div className="mof-stamp absolute -bottom-3 -left-3 bg-white px-4 py-2 text-[#07081A] shadow-xl">
                <p className="text-[10px] font-extrabold text-[#4046B5]">موفوتر 2026</p>
                <p className="text-xs font-black">معتمد ضريبيًا</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Testimonials & Social Proof (آراء وقصص نجاح من مصر)
// ---------------------------------------------------------------------------
function TestimonialsSection() {
  const testimonials = [
    {
      name: "أ. محمود عبد الهادي",
      role: "مدير مكتب محاسبة ومراجع قانوني - القاهرة",
      text: "بدل ما كنا بنقعد 3 أيام نقفل إقرارات الـ VAT لـ 35 عميل، موفوتر خلّانا نقفلهم في نص يوم بدون ولا غلطة واحدة في مطابقة البوابة.",
      stat: "وفّر 70% من وقت المراجعة",
      firm: "مكتب المحاسبون المتحدون",
    },
    {
      name: "م. كريم الشناوي",
      role: "المدير المالي لشركة توريدات تجارية - الإسكندرية",
      text: "منظومة الإيصال والفاتورة الإلكترونية كانت كابوس بالنسبة لفروعنا، مع موفوتر والربط مع الكاشير ارتحنا تمامًا وكل فاتورة بتتسجل في وقتها.",
      stat: "إصدار 1,200+ فاتورة شهرياً",
      firm: "شركة النيل للتوريدات",
    },
    {
      name: "أ. سارة الجمل",
      role: "محاسبة قانونية ومستشارة ضرائب - الجيزة",
      text: "أفضل استثمار عملته لمكتبي.. باقة النخبة خلتني أتابع 100 ملف عميل بتكلفة أقل من 2.5 جنيه للملف شهريًا، قيمة لا تقارن بأي برنامج تاني.",
      stat: "إدارة 100 ملف ضريبي",
      firm: "مكتب الجمل للاستشارات",
    },
  ];

  return (
    <section className="mof-section bg-white">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mof-eyebrow">قصص نجاح من السوق المصري</p>
          <h2 className="mt-3 text-3xl font-extrabold text-[#07081A] md:text-5xl">
            ثقة أكثر من 500+ مكتب محاسبة وشركة في مصر
          </h2>
          <p className="mt-4 text-base leading-8 text-[#5b5c72]">
            شوف زمايلك في المهنة قالوا إيه عن تجربتهم مع موفوتر بعد ما ودّعوا الشغل اليدوي.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <article
              key={idx}
              className="relative flex flex-col justify-between rounded-[2rem] border border-[#4046B5]/12 bg-[#FBFBFF] p-7 shadow-sm transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-1 text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-sm font-medium leading-7 text-[#33344e]">"{item.text}"</p>
              </div>

              <div className="mt-7 border-t border-[#4046B5]/10 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-[#07081A]">{item.name}</p>
                    <p className="mt-0.5 text-xs text-[#5b5c72]">{item.role}</p>
                  </div>
                  <span className="mof-stamp px-2 py-0.5 text-[10px]">{item.stat}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. Pricing Section (4 Tiers for Firms + 2 Tiers for Companies)
// ---------------------------------------------------------------------------
function PricingSection({
  persona,
  plans,
  selectedPlanSku,
  onSelectPlan,
  now,
}: {
  persona: Persona;
  plans: Plan[];
  selectedPlanSku: string;
  onSelectPlan: (sku: string) => void;
  now: number;
}) {
  return (
    <section id="pricing" className="mof-section bg-gradient-to-b from-[#F3F4FB] to-white">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mof-eyebrow">{sales.pricing.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#07081A] md:text-5xl">
            {persona === "firm" ? sales.pricing.firmTitle : sales.pricing.companyTitle}
          </h2>
          <p className="mt-4 text-base leading-8 text-[#5b5c72]">
            {sales.pricing.body}
          </p>

          {/* Annual Plan Assurance Badge */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#10B981]/30 bg-white px-5 py-3 text-xs font-black text-[#065F46] shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] motion-safe:animate-pulse" />
            اشتراك سنوي شامل (12 شهرًا) • يتضمن التحديثات الدورية والدعم الفني والربط مع منظومة الضرائب المصرية ETA
            {isCampaignActive(new Date(now)) && <span className="text-[#4046B5]">العرض مستمر: {timeLeft(now)}</span>}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div
          className={`mt-12 grid gap-6 ${
            persona === "firm"
              ? "md:grid-cols-2 xl:grid-cols-4"
              : "mx-auto max-w-4xl md:grid-cols-2"
          }`}
        >
          {plans.map((plan) => {
            const isFeatured = plan.featured;
            const isSelected = selectedPlanSku === plan.sku;
            const price = plan.annualPiastres;
            const campaignActive = isCampaignActive(new Date(now));
            const discountPiastres = campaignActive ? Math.floor((price * PROMO.discountBps) / 10000) : 0;
            const discountedPrice = price - discountPiastres;
            const vatPiastres = Math.round((discountedPrice * 14) / 100);
            const monthlyPerFile = ((plan.annualPiastres / 100) / plan.fileCount / 12).toFixed(1);

            return (
              <article
                key={plan.sku}
                className={`relative flex min-w-0 flex-col justify-between rounded-[2.2rem] border p-6 transition-all duration-300 hover:-translate-y-2 ${
                  isFeatured
                    ? "border-[#4046B5] bg-[#F7F7FF] shadow-[0_25px_60px_-30px_#4046B5] ring-2 ring-[#4046B5]/20 hover:shadow-[0_35px_70px_-25px_#4046B5]"
                    : "border-[#4046B5]/12 bg-white shadow-sm hover:shadow-xl hover:border-[#4046B5]/30"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 right-6 rounded-full bg-[#4046B5] px-3.5 py-1 text-xs font-black text-white shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <p className="text-xs font-extrabold text-[#4046B5]">{plan.files}</p>
                  <h3 className="mt-2 text-2xl font-black text-[#07081A]">{plan.name}</h3>
                  <p className="mt-2 min-h-12 text-xs leading-6 text-[#5a5b71]">{plan.description}</p>

                  {/* Price Section */}
                  <div className="mt-5 rounded-2xl bg-[#ECECF7]/60 p-4 text-center">
                    {campaignActive && <p className="font-inter text-sm font-bold text-[#64657a] line-through" dir="ltr">{formatEgp(price)}</p>}
                    <p className="font-inter text-3xl font-black tabular-nums text-[#4046B5]" dir="ltr">
                      {formatEgp(discountedPrice)}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#64657a]">
                      اشتراك سنوي قبل الضريبة {campaignActive ? `— وفّرت ${formatEgp(discountPiastres)}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#07081A]">+ 14% VAT = {formatEgp(discountedPrice + vatPiastres)} إجمالي مستحق</p>

                    {persona === "firm" && (
                      <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-[#4046B5] px-3 py-1 font-[Inter] text-xs font-black text-white">
                        <Sparkles className="h-3 w-3" />
                        ما يعادل {monthlyPerFile} ج.م / ملف / شهر
                      </div>
                    )}
                  </div>

                  {/* Capacity Info */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-xl border border-[#4046B5]/10 bg-white p-2.5">
                      <p className="text-[10px] text-[#62647d]">سعة الملفات</p>
                      <p className="mt-0.5 font-bold text-[#4046B5]">{plan.files}</p>
                    </div>
                    <div className="rounded-xl border border-[#4046B5]/10 bg-white p-2.5">
                      <p className="text-[10px] text-[#62647d]">فريق العمل</p>
                      <p className="mt-0.5 font-bold text-[#4046B5]">{plan.users}</p>
                    </div>
                  </div>

                  {/* Decision Cue */}
                  <div className="mt-4 rounded-xl border border-dashed border-[#4046B5]/25 bg-white p-3 text-xs leading-5 text-[#4046B5]">
                    <span className="font-extrabold">تناسبك لو: </span>
                    {plan.decisionCue}
                  </div>

                  {/* Features List */}
                  <ul className="mt-5 space-y-2.5 border-t border-[#4046B5]/10 pt-4 text-xs font-bold">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 leading-5 text-[#33344e]">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    onSelectPlan(plan.sku);
                    scrollToId("upsell");
                  }}
                  className={`mt-7 h-12 w-full rounded-xl font-extrabold text-sm transition ${
                    isSelected
                      ? "bg-[#10B981] text-white hover:bg-[#059669]"
                      : isFeatured
                      ? "bg-[#4046B5] text-white hover:bg-[#343aa0]"
                      : "bg-[#07081A] text-white hover:bg-[#262642]"
                  }`}
                >
                  {isSelected ? "تم اختيار هذه الباقة ✓" : sales.pricing.select}
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7. Footer
// ---------------------------------------------------------------------------
function MofawtarFooter({
  onQuickLink,
  onInteraction,
}: {
  onQuickLink: (id: string) => void;
  onInteraction: (type: string, value: string) => void;
}) {
  const footer = layout.footer;
  return (
    <footer id="contact" className="relative overflow-hidden bg-[#07081A] text-white">
      <div className="container relative py-14 md:py-20">
        <div className="grid gap-10 border-b border-white/12 pb-12 lg:grid-cols-[1.4fr_.75fr_.9fr_.9fr]">
          <div>
            <div className="inline-flex rounded-xl bg-white p-2">
              <img src="/brand/mofawtar-badge-logo.png" alt="مفوتر" className="h-9 w-auto" />
            </div>
            <p className="mt-5 max-w-sm text-sm leading-8 text-white/75">{footer.description}</p>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.06] p-4">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <Building2 className="h-4 w-4 text-[#c8cbff]" />
                {footer.issuer}
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c8cbff]" />
                <span>
                  <strong className="block text-white">{footer.locationTitle}</strong>
                  {footer.address}
                </span>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-[#c8cbff]">{footer.quickTitle}</h3>
            <ul className="mt-5 space-y-3">
              {footer.quickLinks.map((link) => (
                <li key={link.id}>
                  {link.id === "articles" ? (
                    <span className="text-sm text-white/55">{link.label}</span>
                  ) : (
                    <button
                      onClick={() => onQuickLink(link.id)}
                      className="group flex items-center gap-2 text-sm text-white/75 transition hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 text-[#bfc3ff] transition-transform group-hover:-translate-x-1" />
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-[#c8cbff]">{footer.socialTitle}</h3>
            <ul className="mt-5 space-y-3">
              {footer.social.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onInteraction("social", item.label)}
                    className="group flex items-center gap-2 text-sm text-white/75 transition hover:text-white"
                  >
                    <Globe2 className="h-4 w-4 text-[#bfc3ff]" />
                    <span dir="ltr">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-[#c8cbff]">{footer.contactTitle}</h3>
            <ul className="mt-5 space-y-3">
              {footer.contacts.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.url}
                    onClick={() => onInteraction("contact", item.label)}
                    className="group flex items-center gap-2 text-sm text-white/75 transition hover:text-white"
                  >
                    {item.kind === "email" ? (
                      <Mail className="h-4 w-4 text-[#bfc3ff]" />
                    ) : (
                      <Phone className="h-4 w-4 text-[#bfc3ff]" />
                    )}
                    <span dir="ltr">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>{footer.copyright}</p>
          <div className="flex flex-wrap items-center gap-3">
            {footer.legal.map((item, index) => (
              <span key={item} className="flex items-center gap-3">
                <span className="font-bold text-white/80">{item}</span>
                {index < footer.legal.length - 1 && <span className="h-3 w-px bg-white/30" />}
              </span>
            ))}
            <a
              href="/dashboard"
              onClick={() => onInteraction("dashboard", "dashboard")}
              className="font-bold text-[#d7d9ff] hover:text-white"
            >
              لوحة المؤشرات
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// 8. Main Home Component
// ---------------------------------------------------------------------------
export default function Home({ fixedPersona }: { fixedPersona?: Persona } = {}) {
  const [, setLocation] = useLocation();
  const track = usePocTracking();
  const trackRef = useRef(track);
  trackRef.current = track;

  const [persona, setPersona] = useState<Persona>(fixedPersona ?? "firm");
  const [gateOpen, setGateOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [sessionQuoteDate] = useState(() => new Date());
  const [selectedPlanSku, setSelectedPlanSku] = useState("professional");
  const [addonQuantities, setAddonQuantities] = useState<AddonQuantities>({});
  const [consent, setConsent] = useState<Consent | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [activeOperating, setActiveOperating] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState(0);
  const [leadMagnetOpen, setLeadMagnetOpen] = useState(false);
  const [leadMagnetDismissed, setLeadMagnetDismissed] = useState(false);
  const [leadMagnetDelivered, setLeadMagnetDelivered] = useState(false);
  const [leadMagnetEmail, setLeadMagnetEmail] = useState("");
  const [leadMagnetPhone, setLeadMagnetPhone] = useState("");
  const [leadMagnetError, setLeadMagnetError] = useState("");
  const [faqSearch, setFaqSearch] = useState("");

  const demoSectionRef = useRef<HTMLElement>(null);
  const capabilitiesSectionRef = useRef<HTMLElement>(null);
  const leadMagnetMutation = trpc.poc.createLead.useMutation();

  const plans = useMemo(() => getPlansForPersona(persona), [persona]);
  const selectedPlan = plans.find((plan) => plan.sku === selectedPlanSku) ?? plans[0];
  const layoutCopy = layout[persona];
  const operatingCopy = layout.operating[persona];
  const activeOperatingItem = operatingCopy.items[activeOperating] ?? operatingCopy.items[0];
  const activeDemoItem = layout.demo.tabs[activeDemoTab] ?? layout.demo.tabs[0];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryPersona = resolvePersona(params.get("persona") ?? params.get("p"));
    const savedPersona = resolvePersona(localStorage.getItem("mof_persona"));
    const resolved = fixedPersona ?? queryPersona ?? savedPersona;
    if (resolved) {
      setPersona(resolved);
      const entryPlan = getPlansForPersona(resolved).find((p) => p.sku === (resolved === "firm" ? "professional" : "founder")) ?? getPlansForPersona(resolved)[0];
      setSelectedPlanSku(entryPlan.sku);
      localStorage.setItem("mof_persona", resolved);
      trackRef.current("persona_resolved", { persona: resolved, uiContext: fixedPersona ? "route" : queryPersona ? "query" : "storage" });
    }
    setConsent(readConsent());
    setInitialized(true);
    trackRef.current("page_view", { persona: resolved ?? "firm", uiContext: fixedPersona ? "landing_persona" : "landing" });
  }, [fixedPersona]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const node = demoSectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let wasTracked = false;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !wasTracked) {
        wasTracked = true;
        trackRef.current("demo_section_viewed", { persona, uiContext: "demo_section" });
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [persona]);

  useEffect(() => {
    const node = capabilitiesSectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let wasTracked = false;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !wasTracked) {
        wasTracked = true;
        trackRef.current("capabilities_section_viewed", { persona, uiContext: "capabilities_section" });
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [persona]);

  useEffect(() => {
    if (!initialized || gateOpen || leadMagnetDismissed || leadMagnetDelivered || !consent) return;
    let opened = false;
    const maybeOpen = () => {
      if (opened || leadMagnetDelivered || leadMagnetDismissed) return;
      const touchedPricing = sessionStorage.getItem("mof_pricing_touched") === "1";
      const depth = (window.scrollY + window.innerHeight) / Math.max(document.documentElement.scrollHeight, 1);
      const startedAt = Number(sessionStorage.getItem("mof_visit_started") ?? Date.now());
      if (!touchedPricing && (depth >= 0.6 || Date.now() - startedAt >= 45000)) {
        opened = true;
        setLeadMagnetOpen(true);
        trackRef.current("lead_magnet_shown", { persona, uiContext: "payroll_calculator_popup" });
        window.removeEventListener("scroll", maybeOpen);
      }
    };
    if (!sessionStorage.getItem("mof_visit_started")) sessionStorage.setItem("mof_visit_started", String(Date.now()));
    const timeout = window.setTimeout(maybeOpen, 45000);
    window.addEventListener("scroll", maybeOpen, { passive: true });
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("scroll", maybeOpen);
    };
  }, [consent, gateOpen, initialized, leadMagnetDelivered, leadMagnetDismissed, persona]);

  useEffect(() => {
    if (!initialized || !consent) return;
    const onExit = (event: MouseEvent) => {
      const eligible = window.scrollY > window.innerHeight * 0.5 || Date.now() - Number(sessionStorage.getItem("mof_visit_started") ?? Date.now()) > 30000;
      if (event.clientY < 4 && eligible && !sessionStorage.getItem("mof_conversion_blocked") && !localStorage.getItem("mof_exit_seen") && !gateOpen) {
        localStorage.setItem("mof_exit_seen", "1");
        setExitOpen(true);
        trackRef.current("exit_intent_shown", { persona, uiContext: "exit_desktop" });
      }
    };
    if (!sessionStorage.getItem("mof_visit_started")) sessionStorage.setItem("mof_visit_started", String(Date.now()));
    document.addEventListener("mouseout", onExit);
    return () => document.removeEventListener("mouseout", onExit);
  }, [consent, gateOpen, initialized, persona]);

  const choosePersona = (value: Persona, context: string) => {
    const first = getPlansForPersona(value).find((p) => p.sku === (value === "firm" ? "professional" : "founder")) ?? getPlansForPersona(value)[0];
    localStorage.setItem("mof_persona", value);
    setPersona(value);
    setSelectedPlanSku(first.sku);
    setAddonQuantities({});
    setActiveOperating(0);
    setGateOpen(false);
    track("persona_selected", { persona: value, uiContext: context });
  };

  const selectPlan = (sku: string) => {
    sessionStorage.setItem("mof_pricing_touched", "1");
    setSelectedPlanSku(sku);
    setAddonQuantities({});
    track("plan_selected", { persona, uiContext: "pricing_card", properties: { plan_sku: sku } });
  };

  const setAddonQty = (sku: string, qty: number) => {
    setAddonQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[sku];
      } else {
        next[sku] = Math.min(qty, 999);
      }
      return next;
    });
    track("addon_qty_changed", { persona, uiContext: "upsell", properties: { addon_sku: sku, quantity: qty } });
  };

  const toggleAddon = (sku: string) => {
    setAddonQuantities((prev) => {
      const current = prev[sku] || 0;
      const next = { ...prev };
      if (current > 0) {
        delete next[sku];
      } else {
        next[sku] = 1;
      }
      return next;
    });
    track("addon_toggled", { persona, uiContext: "upsell", properties: { addon_sku: sku } });
  };

  const continueToCheckout = () => {
    if (!selectedPlan) return;
    const serializedAddons = serializeAddonQuantities(addonQuantities);
    sessionStorage.setItem("mof_selected_plan", selectedPlan.sku);
    sessionStorage.setItem("mof_persona", persona);
    sessionStorage.setItem("mof_selected_addons", serializedAddons);
    track("checkout_started", {
      persona,
      uiContext: "upsell_cta",
      properties: { plan_sku: selectedPlan.sku, addonQuantities, billingCycle: "annual" },
    });
    const addonParam = serializedAddons ? `&addons=${encodeURIComponent(serializedAddons)}` : "";
    setLocation(`/checkout?plan=${selectedPlan.sku}&persona=${persona}${addonParam}&cycle=annual`);
  };

  const liveQuote = useMemo(() => {
    if (!selectedPlan) return null;
    try {
      return calculateQuote(selectedPlan.sku, addonQuantities, "annual", sessionQuoteDate);
    } catch {
      return null;
    }
  }, [selectedPlan, addonQuantities, sessionQuoteDate]);

  const whatsapp = (placement: string) => {
    sessionStorage.setItem("mof_conversion_blocked", "whatsapp");
    track("whatsapp_cta_clicked", { persona, uiContext: placement });
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  const handleCapabilityAction = (capabilityId: string, status: string) => {
    track("capability_cta_clicked", {
      persona,
      uiContext: "capabilities_section",
      properties: { capability_id: capabilityId, status },
    });
    if (status === "coming") whatsapp(`capability_waitlist_${capabilityId}`);
    else scrollToId("pricing");
  };

  const handleIssuanceDocumentClick = (documentId: string) =>
    track("issuance_document_clicked", { persona, uiContext: "issuance_section", properties: { document_id: documentId } });

  const handleHeroSecondary = () => {
    if (persona === "firm") {
      track("hero_demo_clicked", { persona, uiContext: "hero_secondary" });
      scrollToId("tax-simulator");
    } else {
      track("hero_calculator_clicked", { persona, uiContext: "hero_secondary" });
      scrollToId("tax-simulator");
    }
  };

  const handleFooterQuickLink = (id: string) => {
    track("footer_quick_link_clicked", { persona, uiContext: "footer", properties: { link_id: id } });
    if (id === "home") window.scrollTo({ top: 0, behavior: "smooth" });
    else if (id === "pricing") scrollToId("pricing");
    else if (id === "contact") whatsapp("footer_quick_contact");
  };

  const handleFooterInteraction = (type: string, value: string) =>
    track("footer_interaction", { persona, uiContext: "footer", properties: { type, value } });

  const closeLeadMagnet = () => {
    setLeadMagnetOpen(false);
    setLeadMagnetDismissed(true);
    track("lead_magnet_dismissed", {
      persona,
      uiContext: "payroll_calculator_popup",
      properties: { delivered: leadMagnetDelivered },
    });
  };

  const submitLeadMagnet = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phone = leadMagnetPhone.trim();
    if (!/^\+?[0-9\s-]{8,20}$/.test(phone)) {
      setLeadMagnetError("يرجى إدخال رقم هاتف مصري صحيح.");
      return;
    }
    setLeadMagnetError("");
    leadMagnetMutation.mutate(
      {
        name: "مهتم بحاسبة ضريبة المرتبات والتأمينات",
        email: leadMagnetEmail.trim(),
        phone,
        visitorId: getPocContext().visitorId,
        source: "payroll_tax_calculator_popup",
        marketingOptIn: false,
      },
      {
        onSuccess: () => {
          setLeadMagnetDelivered(true);
          track("lead_magnet_submitted", { persona, uiContext: "payroll_calculator_popup" });
        },
        onError: () => setLeadMagnetError("تعذر تسجيل البيانات الآن. يرجى المحاولة مرة أخرى."),
      }
    );
  };

  const saveConsent = (value: Consent) => {
    localStorage.setItem("mof_consent", JSON.stringify(value));
    setConsent(value);
    track("consent_updated", { persona, uiContext: "cookie" });
  };

  const submitGuide = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLeadSent(true);
    sessionStorage.setItem("mof_conversion_blocked", "lead");
    track("lead_submitted", { persona, uiContext: "guide" });
  };

  const filteredFaq = useMemo(() => {
    if (!faqSearch.trim()) return layout.faq.items;
    const term = faqSearch.toLowerCase();
    return layout.faq.items.filter(
      (item) => item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term)
    );
  }, [faqSearch]);

  const activeCampaign = isCampaignActive(new Date(now));
  const minPricePiastres = Math.min(...plans.map((plan) => plan.annualPiastres));
  const crossPersona = persona === "firm"
    ? { href: "/companies", label: "عندك شركة أو بتشتغل لحسابك؟ شوف نسخة الشركات ←" }
    : { href: "/accounting-offices", label: "عندك مكتب محاسبة؟ شوف نسخة المكاتب ←" };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFBFF] text-[#07081A]">
      {/* 1. Urgent Promo Bar */}
      {activeCampaign && !offerDismissed && (
        <div className="relative z-50 border-b border-[#777ce0]/20 bg-[#07081A] text-white">
          <div className="container flex min-h-11 flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-center text-xs md:text-sm">
            <span className="inline-flex items-center gap-1 font-extrabold text-[#d7d8ff]">
              <BadgePercent className="h-4 w-4 text-[#F59E0B]" />
              {sales.promo.label}:
            </span>
            <span className="font-medium text-white/90">{sales.promo.title}</span>
            <span dir="ltr" className="rounded-md bg-white/10 px-2 py-0.5 font-[Inter] text-[11px] font-bold tabular-nums">
              {timeLeft(now)}
            </span>
            <button
              onClick={() => {
                track("promo_banner_clicked", { persona, uiContext: "top_banner" });
                scrollToId("pricing");
              }}
              className="inline-flex items-center gap-1 font-black text-[#c5c8ff] underline underline-offset-4 hover:text-white"
            >
              {sales.promo.cta}
              <ArrowLeft className="h-3 w-3" />
            </button>
            <button
              aria-label="إغلاق العرض"
              onClick={() => {
                setOfferDismissed(true);
                track("promo_banner_dismissed", { persona, uiContext: "top_banner" });
              }}
              className="rounded-full p-0.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Header */}
      <header className="sticky top-0 z-40 border-b border-[#4046B5]/10 bg-white/90 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3 text-right">
            <div className="inline-flex rounded-xl p-1 transition hover:opacity-90">
              <img src="/brand/mofawtar-badge-logo.png" alt="مفوتر" className="h-10 w-auto" />
            </div>
            <span className="hidden border-r border-[#4046B5]/15 pr-3 text-xs font-bold text-[#585972] sm:block">
              {persona === "firm" ? "مسار مكاتب المحاسبة" : "مسار الشركات والمحاسبين"}
              <span className="mt-0.5 block font-extrabold text-[#4046B5] group-hover:underline">تبديل المسار</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-extrabold lg:flex">
            <button onClick={() => scrollToId("tax-simulator")} className="transition hover:text-[#4046B5]">
              حاسبة التوفير
            </button>
            <button onClick={() => scrollToId("capabilities")} className="transition hover:text-[#4046B5]">
              قدرات المنظومة
            </button>
            <button onClick={() => scrollToId("pricing")} className="transition hover:text-[#4046B5]">
              الباقات والأسعار
            </button>
            <button onClick={() => scrollToId("upsell")} className="transition hover:text-[#4046B5]">
              الإضافات
            </button>
            <button onClick={() => scrollToId("faq")} className="transition hover:text-[#4046B5]">
              الأسئلة الشائعة
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => scrollToId("pricing")}
              className="h-11 rounded-xl bg-[#4046B5] px-6 text-sm font-extrabold text-white shadow-md shadow-[#4046B5]/25 transition-all hover:bg-[#343aa0] hover:scale-105 active:scale-95"
            >
              اختَر باقتك
              <ArrowLeft className="mr-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero */}
        <PersonaHero
          persona={persona}
          showPersonaSwitcher={!fixedPersona}
          onSwitchPersona={(p) => choosePersona(p, "hero_toggle")}
          onPrimary={() => {
            track("hero_cta_clicked", { persona, uiContext: "hero_primary" });
            scrollToId("pricing");
          }}
          onSecondary={handleHeroSecondary}
        />

        <div className="container pt-6 text-center">
          <Link href={crossPersona.href} className="text-sm font-bold text-[#4046B5] underline underline-offset-4 hover:text-[#343aa0]">
            {crossPersona.label}
          </Link>
          <p className="mt-2 text-xs text-[#64657a]">باقات تبدأ من {formatEgp(minPricePiastres)} سنويًا</p>
        </div>

        {/* Interactive Tax & Invoicing Simulator */}
        <TaxInvoicingSimulator
          persona={persona}
          onSelectPlan={(sku) => {
            selectPlan(sku);
            track("simulator_plan_selected", { persona, uiContext: "tax_simulator", properties: { sku } });
          }}
        />

        {/* Product Capabilities */}
        <ProductCapabilities sectionRef={capabilitiesSectionRef} onAction={handleCapabilityAction} />

        {/* Issuance Follow-up */}
        <IssuanceFollowUp onAction={handleCapabilityAction} onDocumentClick={handleIssuanceDocumentClick} />

        {/* Pain & Value Section */}
        <section className="mof-section bg-[#ECECF7]/60">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mof-eyebrow">{layoutCopy.pain.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#07081A] md:text-5xl">
                {layoutCopy.pain.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-[#5b5c72] md:text-lg">
                {layoutCopy.pain.body}
              </p>
            </div>

            <div
              className={`mt-12 grid gap-6 ${
                persona === "firm" ? "md:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3"
              }`}
            >
              {layoutCopy.pain.items.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-[2rem] border border-[#4046B5]/12 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <span className="inline-flex rounded-full bg-[#ECECF7] px-3 py-1 text-[11px] font-extrabold text-[#4046B5]">
                    {item.label}
                  </span>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <h3 className="text-xl font-extrabold leading-8 text-[#07081A]">{item.title}</h3>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#07081A] text-white">
                      {index === 0 ? (
                        <Layers3 className="h-5 w-5" />
                      ) : index === 1 ? (
                        <FileDown className="h-5 w-5" />
                      ) : index === 2 ? (
                        <ListChecks className="h-5 w-5" />
                      ) : (
                        <UsersRound className="h-5 w-5" />
                      )}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#5b5c72]">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Operating Scenarios */}
        <section id="operating" className="mof-section bg-[#07081A] text-white">
          <div className="container">
            <div className="grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                <p className="mof-eyebrow text-[#c6c8ff]">{operatingCopy.eyebrow}</p>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">{operatingCopy.title}</h2>
                <p className="mt-5 text-base leading-8 text-white/70">{operatingCopy.body}</p>

                <div className="mt-8 space-y-3">
                  {operatingCopy.items.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveOperating(index);
                        track("operating_scenario_selected", {
                          persona,
                          uiContext: "operating_section",
                          properties: { scenario: item.id },
                        });
                      }}
                      className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-right transition ${
                        activeOperating === index
                          ? "border-[#b8bcff] bg-[#4046B5]"
                          : "border-white/10 bg-white/[.045] hover:bg-white/[.09]"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-extrabold">{item.label}</span>
                        <span className="mt-1 block text-xs text-white/60">{item.cue}</span>
                      </span>
                      <ArrowLeft
                        className={`h-4 w-4 shrink-0 ${
                          activeOperating === index ? "text-white" : "text-[#b8bcff]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2.2rem] border border-white/10 bg-white/[.04] p-5 shadow-2xl">
                <div className="rounded-[1.6rem] border border-white/10 bg-[#101132] p-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#f3b750]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#6d72db]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#38c99b]" />
                    </div>
                    <span className="mof-stamp-white px-3 py-1 text-[10px]">موفوتر — مسار العمل المنظم</span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-[.75fr_1.25fr]">
                    <div className="rounded-2xl bg-[#4046B5] p-5">
                      <p className="text-[11px] font-bold text-white/60">الحالة المختارة</p>
                      <p className="mt-2 text-xl font-extrabold leading-8">{activeOperatingItem.label}</p>
                      <div className="mt-7 border-t border-white/20 pt-4">
                        <p className="text-[10px] font-bold text-white/60">الخطوة التالية</p>
                        <p className="mt-1 text-xs font-extrabold">{activeOperatingItem.cue}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-[#c6c8ff]">كيف تنظم القرار؟</p>
                          <h3 className="mt-2 text-2xl font-extrabold leading-tight">{activeOperatingItem.title}</h3>
                        </div>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#d7d8ff]">
                          {activeOperating === 0 ? (
                            <FolderKanban className="h-5 w-5" />
                          ) : activeOperating === 1 ? (
                            <UsersRound className="h-5 w-5" />
                          ) : (
                            <Zap className="h-5 w-5" />
                          )}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-white/70">{activeOperatingItem.body}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection
          persona={persona}
          plans={plans}
          selectedPlanSku={selectedPlanSku}
          onSelectPlan={selectPlan}
          now={now}
        />

        {/* Upsell / Addons Section */}
        <section id="upsell" className="mof-section bg-[#07081A] text-white">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] items-start">
              <div>
                <p className="mof-eyebrow text-[#c6c8ff]">{sales.upsell.eyebrow}</p>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl text-white">{sales.upsell.title}</h2>
                <p className="mt-5 text-base leading-8 text-white/80">{sales.upsell.body}</p>

                <div className="mt-8 rounded-3xl border border-white/15 bg-white/[.07] p-6 backdrop-blur-md">
                  <p className="text-xs font-bold text-[#c6c8ff]">باقتك المختارة حاليًا</p>
                  <p className="mt-2 text-2xl font-black text-white flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#10B981] animate-pulse" />
                    {selectedPlan?.name}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-white/70">{selectedPlan?.decisionCue}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs font-bold text-[#b9bdff] border-t border-white/10 pt-3">
                    <span>{selectedPlan?.files}</span>
                    <span>•</span>
                    <span>{selectedPlan?.users}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {ADDONS.map((addon) => {
                  const included = addon.includedIn?.includes(selectedPlan?.sku ?? "");
                  const quantity = included ? 1 : addonQuantities[addon.sku] || 0;
                  const isSelected = quantity > 0;
                  const unitPrice = addon.annualPiastres;
                  const lineTotal = unitPrice * (included ? 1 : quantity);

                  return (
                    <div
                      key={addon.sku}
                      className={`relative flex flex-col justify-between rounded-3xl border-2 p-6 transition-all duration-300 ${
                        included
                          ? "border-[#10B981]/50 bg-[#10B981]/10 text-white"
                          : isSelected
                          ? "border-[#10B981] bg-[#10B981]/15 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-2 ring-[#10B981]/40"
                          : "border-white/25 bg-white/[.04] hover:border-white/40 hover:bg-white/[.06] text-white"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Info & Checkbox */}
                        <div className="flex items-start gap-4 flex-1">
                          {/* Toggle Checkbox / Button */}
                          <button
                            type="button"
                            disabled={included}
                            onClick={() => toggleAddon(addon.sku)}
                            className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 transition-all duration-300 ${
                              included
                                ? "border-[#10B981] bg-[#10B981] text-white shadow-xs cursor-default"
                                : isSelected
                                ? "border-[#10B981] bg-[#10B981] text-white shadow-lg shadow-[#10B981]/40 cursor-pointer scale-110"
                                : "border-white/50 bg-[#0F102A] text-transparent hover:border-[#10B981] hover:bg-[#10B981]/10 cursor-pointer"
                            }`}
                            title={included ? "متضمنة في الباقة" : isSelected ? "إلغاء التحديد" : "إضافة إلى الخطة"}
                          >
                            <Check className="h-4 w-4 stroke-[3]" />
                          </button>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h3 className="text-lg font-black text-white">{addon.name}</h3>
                              {included ? (
                                <span className="rounded-full bg-[#10B981] px-3 py-0.5 text-[11px] font-black text-white shadow-xs">
                                  ✓ متضمنة في باقتك مجاناً
                                </span>
                              ) : isSelected ? (
                                <span className="rounded-full bg-[#10B981] px-3 py-0.5 text-[11px] font-black text-white shadow-xs">
                                  ✓ مضافة ({quantity})
                                </span>
                              ) : (
                                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-white/80">
                                  إضافة اختيارية
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-sm leading-6 text-white/85">
                              {addon.description}
                            </p>
                            <p className="mt-1.5 text-xs font-extrabold text-[#c6c8ff]">
                              {addon.salesCue}
                            </p>
                          </div>
                        </div>

                        {/* Controls & Price */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-3 md:border-0 md:pt-0 md:flex-col md:items-end">
                          {/* Interactive Quantity Stepper */}
                          {!included && (
                            <div className="flex items-center gap-2 bg-white/10 rounded-2xl p-1.5 border border-white/15">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddonQty(addon.sku, Math.max(0, quantity - 1));
                                }}
                                disabled={quantity <= 0}
                                className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="إنقاص الكمية"
                              >
                                <Minus className="h-4 w-4" />
                              </button>

                              <div className="px-2 text-center min-w-[2.5rem]">
                                <span className="font-[Inter] text-base font-black text-white" dir="ltr">
                                  {quantity}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddonQty(addon.sku, quantity + 1);
                                }}
                                className="grid h-8 w-8 place-items-center rounded-xl bg-[#4046B5] text-white transition hover:bg-[#343aa0] shadow-sm"
                                title="زيادة الكمية"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          {/* Price Tag */}
                          <div className="text-left">
                            <p className="font-[Inter] text-xl font-black text-white" dir="ltr">
                              {included ? "مجاناً" : isSelected ? `+ ${formatEgp(lineTotal)}` : `+ ${formatEgp(unitPrice)}`}
                            </p>
                            <p className="text-[10px] font-extrabold text-[#a5a9d8] mt-0.5" dir="rtl">
                              {included
                                ? "ضمن الباقة الأساسية"
                                : isSelected && quantity > 1
                                ? `(${quantity} × ${formatEgp(unitPrice)}) / سنويًا`
                                : "/ سنويًا للوحدة"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Real-time Quote Summary Card */}
                {liveQuote && (
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="text-xs text-[#c6c8ff] font-bold">الإجمالي السنوي التقديري (شامل الضريبة 14% والخصم):</p>
                      <p className="font-extrabold text-white mt-0.5">
                        {liveQuote.plan.name} {liveQuote.addons.length > 0 && `+ ${liveQuote.addons.length} إضافات (${liveQuote.addons.reduce((s, a) => s + a.quantity, 0)} وحدات)`}
                      </p>
                    </div>
                    <div className="text-left" dir="ltr">
                      <span className="font-[Inter] text-2xl font-black text-[#10B981]">
                        {formatEgp(liveQuote.totalPiastres)}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={continueToCheckout}
                  className="mt-2 h-14 rounded-2xl bg-white text-base font-black text-[#4046B5] shadow-xl hover:bg-[#ECECF7] hover:scale-[1.01] active:scale-98 transition-all"
                >
                  {sales.upsell.cta}
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Comparison Table */}
        <section className="mof-section bg-[#FBFBFF]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mof-eyebrow">{layout.comparison.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#07081A] md:text-5xl">
                {layout.comparison.title}
              </h2>
            </div>

            <div className="mt-10 overflow-hidden rounded-[2rem] border border-[#4046B5]/15 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-right">
                  <thead>
                    <tr className="bg-[#07081A] text-white">
                      <th className="p-5 text-sm font-extrabold">نقطة القرار والمقارنة</th>
                      <th className="p-5 text-sm font-extrabold text-white/60">بدون موفوتر (الطريقة اليدوية)</th>
                      <th className="p-5 text-sm font-extrabold text-[#d7d8ff]">مع منظومة موفوتر السحابية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {layout.comparison.rows.map((row, index) => (
                      <tr key={row.need} className={index % 2 ? "bg-[#F3F4FB]" : "bg-white"}>
                        <td className="p-5 text-sm font-extrabold text-[#07081A]">{row.need}</td>
                        <td className="p-5 text-sm leading-7 text-[#696a80]">{row.ordinary}</td>
                        <td className="p-5 text-sm font-extrabold leading-7 text-[#4046B5]">{row.mof}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mof-section bg-white">
          <div className="container max-w-4xl">
            <div className="text-center">
              <p className="mof-eyebrow">إجابات مباشرة وواضحة</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[#07081A] md:text-5xl">{layout.faq.title}</h2>
              <p className="mt-3 text-sm text-[#5b5c72]">كل الأسئلة التي تدور في بالك حول منظومة الضرائب المصرية وموفوتر.</p>

              {/* FAQ Search Bar */}
              <div className="relative mx-auto mt-6 max-w-md">
                <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-[#8e90a8]" />
                <input
                  type="text"
                  placeholder="ابحث في الأسئلة الشائعة..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#4046B5]/15 bg-[#FBFBFF] pr-10 pl-4 text-xs font-bold text-[#07081A] outline-none transition focus:border-[#4046B5]"
                />
              </div>
            </div>

            <div className="mt-10 space-y-3">
              {filteredFaq.map((item, index) => (
                <details
                  key={item.question}
                  onToggle={(event) => {
                    if ((event.currentTarget as HTMLDetailsElement).open) {
                      track("faq_opened", {
                        persona,
                        uiContext: "selection_faq",
                        properties: { question_index: index },
                      });
                    }
                  }}
                  className="group rounded-2xl border border-[#4046B5]/12 bg-[#FBFBFF] p-5 transition hover:border-[#4046B5]/25"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-extrabold text-[#07081A]">
                    <span>{item.question}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#4046B5] transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 border-t border-[#4046B5]/10 pt-4 text-sm leading-7 text-[#5b5c72]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="pb-16 pt-6">
          <div className="container">
            <div className="grid gap-8 overflow-hidden rounded-[2.5rem] bg-[#4046B5] p-8 text-white md:grid-cols-[1fr_auto] md:p-12 shadow-2xl">
              <div>
                <p className="text-xs font-extrabold tracking-[.18em] text-[#d7d8ff]">دليل البداية السريعة</p>
                <h2 className="mt-3 text-3xl font-black md:text-4xl">{sales.cta.title}</h2>
                <p className="mt-4 max-w-xl text-sm leading-8 text-white/80">{sales.cta.body}</p>

                <form onSubmit={submitGuide} className="mt-6 flex max-w-lg flex-col gap-3 sm:flex-row">
                  <input
                    required
                    type="email"
                    placeholder="بريد العمل الإلكتروني"
                    className="h-12 flex-1 rounded-xl border-0 bg-white px-4 text-sm text-[#07081A] outline-none"
                    dir="ltr"
                  />
                  <Button type="submit" className="h-12 rounded-xl bg-[#07081A] font-extrabold hover:bg-[#232444]">
                    {leadSent ? "تم استلام طلبك ✓" : "أرسل لي الدليل المجاني"}
                  </Button>
                </form>
              </div>

              <div className="flex flex-col justify-center gap-3 self-center">
                <Button
                  onClick={() => whatsapp("bottom_cta")}
                  variant="outline"
                  className="h-14 rounded-2xl border-white/35 bg-white/10 px-7 text-base font-extrabold text-white hover:bg-white hover:text-[#4046B5]"
                >
                  <MessageCircle className="ml-2 h-5 w-5" />
                  {sales.cta.button}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MofawtarFooter onQuickLink={handleFooterQuickLink} onInteraction={handleFooterInteraction} />

      {/* Floating Sticky Conversion Bar */}
      <div className="fixed bottom-5 left-5 right-5 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-white/20 bg-[#07081A]/95 px-4 py-2.5 text-white shadow-2xl backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-ping" />
          <span className="text-xs font-extrabold">باقات تبدأ من 250 ج.م/سنة</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => scrollToId("pricing")}
            className="h-9 rounded-full bg-[#4046B5] px-4 text-xs font-black text-white hover:bg-[#343aa0]"
          >
            اختَر باقتك
          </Button>
          <button
            onClick={() => whatsapp("floating")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366] text-white transition hover:scale-110"
            aria-label="تواصل عبر واتساب"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cookies Consent */}
      {consent === null && (
        <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-2xl rounded-[1.5rem] border border-[#4046B5]/15 bg-white p-4 shadow-2xl md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[#07081A]">{core.cookies.title}</p>
              <p className="mt-1 max-w-xl text-xs leading-5 text-[#5b5c72]">{core.cookies.body}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => saveConsent({ analytics: false, marketing: false })}>
                {core.cookies.reject}
              </Button>
              <Button size="sm" className="bg-[#4046B5]" onClick={() => saveConsent({ analytics: true, marketing: true })}>
                {core.cookies.accept}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Persona Gate Dialog */}
      <Dialog
        open={gateOpen}
        onOpenChange={(open) => {
          if (!open) track("persona_gate_dismissed", { persona, uiContext: "gate" });
          setGateOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden rounded-[2.5rem] border-0 p-0">
          <div className="bg-[#07081A] p-8 text-white">
            <p className="text-xs font-extrabold tracking-[.18em] text-[#c6c8ff]">{sales.gate.eyebrow}</p>
            <DialogHeader>
              <DialogTitle className="mt-3 text-3xl font-black text-white">{sales.gate.title}</DialogTitle>
              <DialogDescription className="mt-3 text-sm leading-7 text-white/75">
                {sales.gate.body}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 bg-white">
            <button
              onClick={() => choosePersona("firm", "gate")}
              className="rounded-2xl border-2 border-[#4046B5]/15 p-6 text-right transition hover:-translate-y-1 hover:border-[#4046B5] hover:bg-[#F7F7FF]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ECECF7] text-[#4046B5]">
                <UsersRound className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-black text-[#07081A]">{sales.gate.firm.title}</h3>
              <p className="mt-2 text-xs leading-6 text-[#5b5c72]">{sales.gate.firm.body}</p>
            </button>

            <button
              onClick={() => choosePersona("company", "gate")}
              className="rounded-2xl border-2 border-[#4046B5]/15 p-6 text-right transition hover:-translate-y-1 hover:border-[#4046B5] hover:bg-[#F7F7FF]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ECECF7] text-[#4046B5]">
                <Building2 className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-black text-[#07081A]">{sales.gate.company.title}</h3>
              <p className="mt-2 text-xs leading-6 text-[#5b5c72]">{sales.gate.company.body}</p>
            </button>

            <button
              onClick={() => {
                setGateOpen(false);
                track("persona_gate_skipped", { persona, uiContext: "gate" });
              }}
              className="sm:col-span-2 text-center text-xs font-bold text-[#64657a] hover:text-[#4046B5]"
            >
              {sales.gate.skip}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Intent Dialog */}
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="max-w-md rounded-[2.2rem] p-7">
          <DialogHeader>
            <p className="text-xs font-extrabold tracking-[.18em] text-[#4046B5]">قبل ما تقفل الصفحة</p>
            <DialogTitle className="mt-2 text-2xl font-black text-[#07081A]">
              مش متأكد إيه الباقة اللي تناسبك؟
            </DialogTitle>
            <DialogDescription className="text-xs leading-6 text-[#5b5c72]">
              قولنا بس على عدد الملفات أو حجم الفواتير، وفريقنا المصري المتخصص هيرشحلك أنسب وأوفر حل لمكتبك أو شركتك.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex flex-col gap-3">
            <Button onClick={() => whatsapp("exit_intent")} className="h-12 rounded-xl bg-[#4046B5] font-extrabold">
              <MessageCircle className="ml-2 h-4 w-4" />
              استشر خبير الضرائب عبر واتساب
            </Button>
            <Button variant="outline" onClick={() => setExitOpen(false)} className="rounded-xl">
              أكمل التصفح
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Magnet Modal */}
      <Dialog
        open={leadMagnetOpen}
        onOpenChange={(open) => {
          if (!open && leadMagnetOpen) closeLeadMagnet();
          else setLeadMagnetOpen(open);
        }}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-[2.2rem] border-0 p-0">
          <div className="bg-[#07081A] p-7 text-white">
            <p className="text-xs font-extrabold tracking-[.16em] text-[#c6c8ff]">{sales.leadMagnet.eyebrow}</p>
            <DialogHeader>
              <DialogTitle className="mt-2 text-2xl font-black text-white">{sales.leadMagnet.title}</DialogTitle>
              <DialogDescription className="mt-2 text-xs leading-6 text-white/75">
                {sales.leadMagnet.body}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-white">
            {leadMagnetDelivered ? (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#ECECF7] text-[#4046B5]">
                  <Check className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-xl font-black text-[#07081A]">{sales.leadMagnet.successTitle}</h3>
                <p className="mt-2 text-xs leading-6 text-[#5b5c72]">{sales.leadMagnet.successBody}</p>
                <a
                  href={sales.leadMagnet.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track("lead_magnet_calculator_opened", { persona, uiContext: "payroll_calculator_popup" })}
                  className="mt-5 inline-flex h-12 items-center rounded-xl bg-[#4046B5] px-6 text-xs font-black text-white transition hover:bg-[#343aa0]"
                >
                  {sales.leadMagnet.openCalculator}
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </a>
              </div>
            ) : (
              <form onSubmit={submitLeadMagnet} className="space-y-4">
                <label className="block text-xs font-bold text-[#07081A]">
                  <span>{sales.leadMagnet.email}</span>
                  <input
                    required
                    value={leadMagnetEmail}
                    onChange={(e) => setLeadMagnetEmail(e.target.value)}
                    type="email"
                    dir="ltr"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#4046B5]/15 bg-[#FBFBFF] px-4 text-xs text-[#07081A] outline-none transition focus:border-[#4046B5]"
                  />
                </label>
                <label className="block text-xs font-bold text-[#07081A]">
                  <span>{sales.leadMagnet.phone}</span>
                  <input
                    required
                    value={leadMagnetPhone}
                    onChange={(e) => setLeadMagnetPhone(e.target.value)}
                    type="tel"
                    inputMode="tel"
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#4046B5]/15 bg-[#FBFBFF] px-4 text-xs text-[#07081A] outline-none transition focus:border-[#4046B5]"
                  />
                </label>
                {leadMagnetError && (
                  <p role="alert" className="rounded-xl bg-[#fff0ed] p-2.5 text-xs font-bold text-[#b84025]">
                    {leadMagnetError}
                  </p>
                )}
                <p className="text-[11px] leading-5 text-[#6b6c80]">{sales.leadMagnet.note}</p>
                <Button
                  type="submit"
                  disabled={leadMagnetMutation.isPending}
                  className="h-12 w-full rounded-xl bg-[#4046B5] font-black hover:bg-[#343aa0]"
                >
                  {leadMagnetMutation.isPending ? sales.leadMagnet.processing : sales.leadMagnet.submit}
                </Button>
              </form>
            )}
            <button
              type="button"
              onClick={closeLeadMagnet}
              className="mt-4 w-full text-center text-xs font-bold text-[#66677d] hover:text-[#4046B5]"
            >
              {sales.leadMagnet.dismiss}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

