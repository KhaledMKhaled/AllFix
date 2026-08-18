import content from "@/content/poc.ar.json";
import { getPocContext, usePocTracking } from "@/hooks/usePocTracking";
import { ADDONS, formatEgp, getPlansForPersona, parseAddonQuantities, PLANS, PROMO, serializeAddonQuantities, type AddonQuantities } from "@shared/poc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  FileCheck,
  HelpCircle,
  LockKeyhole,
  Receipt,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Building2,
  Phone,
  Mail,
  User,
  BadgePercent,
  Plus,
  Minus
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const track = usePocTracking();
  const queryString = window.location.search;
  const search = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const persona: "firm" | "company" = search.get("persona") === "company" ? "company" : "firm";
  const availablePlans = useMemo(() => getPlansForPersona(persona), [persona]);
  const initialPlan = search.get("plan") ?? sessionStorage.getItem("mof_selected_plan") ?? availablePlans[0].sku;
  const [planSku, setPlanSku] = useState(
    availablePlans.some((item) => item.sku === initialPlan) ? initialPlan : availablePlans[0].sku
  );
  const cycle = "annual" as const;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("card");

  const [addonQuantities, setAddonQuantities] = useState<AddonQuantities>(() => {
    const fromQuery = search.get("addons");
    if (fromQuery) return parseAddonQuantities(fromQuery);
    try {
      const stored = sessionStorage.getItem("mof_selected_addons");
      return parseAddonQuantities(stored);
    } catch {
      return {};
    }
  });

  const quote = trpc.poc.quote.useQuery({
    planSku,
    addonQuantities,
    billingCycle: "annual",
  });
  const createOrder = trpc.poc.createOrder.useMutation();
  const plan = PLANS.find((item) => item.sku === planSku);
  const trackingStarted = useRef(false);

  useEffect(() => {
    const requested = search.get("plan") ?? sessionStorage.getItem("mof_selected_plan");
    if (requested && availablePlans.some((item) => item.sku === requested)) {
      setPlanSku(requested);
    }
  }, [availablePlans, search]);

  useEffect(() => {
    if (!trackingStarted.current) {
      trackingStarted.current = true;
      track("checkout_started", { persona, uiContext: "checkout" });
    }
  }, [track, persona]);

  useEffect(() => {
    setAddonQuantities((current) => {
      const next = { ...current };
      let changed = false;
      Object.keys(next).forEach((sku) => {
        if (ADDONS.find((item) => item.sku === sku)?.includedIn?.includes(planSku)) {
          delete next[sku];
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [planSku]);

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
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const context = getPocContext();

    createOrder.mutate(
      {
        visitorId: context.visitorId,
        persona,
        name: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
        planSku,
        addonQuantities,
        billingCycle: cycle,
      },
      {
        onSuccess: (result) => setLocation(`/demo-payment/${result.paymentToken}`),
      }
    );
  };

  const paymentMethods = [
    {
      id: "card",
      name: "البطاقات البنكية وميزة",
      desc: "فيزا، ماستركارد، بطاقة ميزة الوطنية",
      badge: "دفع فوري",
      icon: CreditCard,
    },
    {
      id: "fawry",
      name: "شبكة فوري (Fawry Pay)",
      desc: "ادفع من أي منفذ فوري أو محفظة إلكترونية",
      badge: "رمز دفع فوري",
      icon: Receipt,
    },
    {
      id: "wallets",
      name: "المحافظ وإنستاباي (InstaPay)",
      desc: "فودافون كاش، أورنج، اتصالات، وي، إنستاباي",
      badge: "تحويل مباشر",
      icon: Smartphone,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFF] py-8 md:py-14 text-[#07081A]">
      <div className="container max-w-6xl">
        {/* Top Navigation */}
        <div className="mb-8 flex items-center justify-between border-b border-[#4046B5]/10 pb-5">
          <a href="/" className="inline-flex items-center gap-2">
            <img src="/brand/mofawtar-badge-logo.png" alt="مفوتر" className="h-9 w-auto" />
          </a>
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-extrabold text-[#4046B5] transition hover:text-[#343aa0]"
          >
            <ArrowRight className="h-4 w-4" />
            الرجوع إلى الصفحة الرئيسية
          </a>
        </div>

        {/* Stepper Header */}
        <div className="mb-8 rounded-2xl border border-[#4046B5]/12 bg-[#ECECF7]/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-extrabold">
            <div className="flex items-center gap-2 text-[#4046B5]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#4046B5] text-white">1</span>
              <span>تأكيد الباقة والتفاصيل</span>
            </div>
            <div className="hidden h-px flex-1 bg-[#4046B5]/20 md:block" />
            <div className="flex items-center gap-2 text-[#07081A]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white border border-[#4046B5]/30">2</span>
              <span>بيانات الاتصال والنشاط</span>
            </div>
            <div className="hidden h-px flex-1 bg-[#4046B5]/20 md:block" />
            <div className="flex items-center gap-2 text-[#64657a]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white border border-[#4046B5]/20">3</span>
              <span>اعتماد الدفع التجريبي</span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          {/* Main Checkout Form */}
          <form onSubmit={submit} className="rounded-[2.2rem] border border-[#4046B5]/12 bg-white p-6 md:p-9 shadow-sm">
            <div>
              <p className="mof-eyebrow">إتمام الاشتراك الآمن</p>
              <h1 className="mt-2 text-3xl font-extrabold text-[#07081A]">{content.checkout.title}</h1>
              <p className="mt-2 text-xs leading-6 text-[#5b5c72]">
                خطوة واحدة تفصلك عن تنظيم فواتيرك وملفاتك الضريبية بأعلى دقة واحترافية.
              </p>
            </div>

            {/* Section 1: Contact & Business Details */}
            <section className="mt-8 border-t border-[#4046B5]/10 pt-7">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-[#07081A]">
                <Building2 className="h-4 w-4 text-[#4046B5]" />
                1. بيانات النشاط والتواصل
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="customer-name" className="text-xs font-bold">
                    {persona === "firm" ? "اسم المكتب / المسؤول" : "اسم الشركة أو النشاط التجاري"} *
                  </Label>
                  <Input
                    id="customer-name"
                    name="name"
                    placeholder="مثال: مكتب النيل للمحاسبة والمراجعة"
                    required
                    className="h-11 rounded-xl border-[#4046B5]/20 text-xs"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="customer-phone" className="text-xs font-bold">
                    رقم الهاتف المحمول (واتساب) *
                  </Label>
                  <Input
                    id="customer-phone"
                    name="phone"
                    placeholder="01xxxxxxxxx"
                    required
                    dir="ltr"
                    inputMode="tel"
                    className="h-11 rounded-xl border-[#4046B5]/20 text-xs"
                  />
                </div>

                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="customer-email" className="text-xs font-bold">
                    البريد الإلكتروني للعمل *
                  </Label>
                  <Input
                    id="customer-email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    dir="ltr"
                    className="h-11 rounded-xl border-[#4046B5]/20 text-xs"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Choose Plan */}
            <section className="mt-8 border-t border-[#4046B5]/10 pt-7">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-extrabold text-[#07081A]">
                  <Receipt className="h-4 w-4 text-[#4046B5]" />
                  2. تأكيد باقة الاشتراك
                </h2>
                <span className="mof-stamp px-2 py-0.5 text-[10px]">
                  {persona === "firm" ? "باقات مكاتب المحاسبة" : "باقة الشركات"}
                </span>
              </div>

              <RadioGroup value={planSku} onValueChange={setPlanSku} className="mt-4 grid gap-3">
                {availablePlans.map((item) => {
                  const isCurrent = planSku === item.sku;
                  const price = item.annualPiastres;
                  return (
                    <label
                      key={item.sku}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all duration-300 ${
                        isCurrent
                          ? "border-[#4046B5] bg-[#ECECF7]/80 ring-2 ring-[#4046B5]/40 shadow-md shadow-[#4046B5]/10 scale-[1.01]"
                          : "border-[#4046B5]/12 bg-white hover:border-[#4046B5]/30 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={item.sku} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-sm text-[#07081A]">{item.name}</p>
                            {item.featured && (
                              <span className="rounded-full bg-[#4046B5] px-2 py-0.5 text-[10px] font-bold text-white">
                                موصى بها
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#64657a]">
                            {item.files} · {item.users}
                          </p>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="font-[Inter] text-sm font-black text-[#4046B5]" dir="ltr">
                          {formatEgp(price)}
                        </span>
                        <p className="text-[10px] text-[#8e90a8]">
                          / سنويًا
                        </p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </section>

            {/* Section 3: Billing Plan Type */}
            <section className="mt-8 border-t border-[#4046B5]/10 pt-7">
              <h2 className="text-base font-extrabold text-[#07081A]">3. نوع الاشتراك وفترة الصلاحية</h2>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#10B981]/30 bg-[#ECFDF5] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#10B981] text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-black text-[#065F46]">اشتراك سنوي شامل معتمد (12 شهرًا)</p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#047857]">
                      يشمل كافة التحديثات الدورية والدعم الفني والربط مع منظومة مصلحة الضرائب المصرية ETA
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#10B981] px-3 py-1 text-xs font-black text-white shadow-xs">
                  سنة كاملة
                </span>
              </div>
            </section>

            {/* Section 4: Add-ons */}
            <section className="mt-8 border-t border-[#4046B5]/10 pt-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#07081A]">4. الإضافات وسعات التشغيل</h2>
                  <p className="mt-1 text-xs text-[#64657a]">اختر وحدات وكميات إضافية حسب احتياج فريقك؛ وسيتم احتسابها فوراً في الفاتورة.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {ADDONS.map((item) => {
                  const included = item.includedIn?.includes(planSku);
                  const quantity = included ? 1 : addonQuantities[item.sku] || 0;
                  const isChecked = quantity > 0;
                  const unitPrice = item.annualPiastres;
                  const lineTotal = unitPrice * (included ? 1 : quantity);

                  return (
                    <div
                      key={item.sku}
                      className={`flex flex-col justify-between rounded-2xl border-2 p-4 transition-all duration-300 ${
                        included
                          ? "border-[#10B981]/40 bg-[#10B981]/10"
                          : isChecked
                          ? "border-[#10B981] bg-[#ECFDF5] ring-2 ring-[#10B981]/40 shadow-md shadow-[#10B981]/10 scale-[1.02]"
                          : "border-[#4046B5]/15 bg-white hover:border-[#4046B5]/40 hover:bg-slate-50 hover:shadow-md"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              disabled={included}
                              onClick={() => toggleAddon(item.sku)}
                              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-all duration-300 ${
                                included
                                  ? "border-[#10B981] bg-[#10B981] text-white cursor-default"
                                  : isChecked
                                  ? "border-[#10B981] bg-[#10B981] text-white shadow-md shadow-[#10B981]/40 cursor-pointer scale-110"
                                  : "border-[#4046B5]/40 bg-[#F7F7FF] text-transparent hover:border-[#10B981] hover:bg-[#10B981]/10 cursor-pointer"
                              }`}
                              title={included ? "متضمنة في الباقة" : isChecked ? "إلغاء التحديد" : "إضافة إلى الطلب"}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </button>
                            <div>
                              <p className="text-xs font-black text-[#07081A] flex items-center gap-1.5">
                                {item.name}
                                {included && (
                                  <span className="rounded-full bg-[#10B981] px-2 py-0.5 text-[9px] font-black text-white">
                                    متضمنة
                                  </span>
                                )}
                              </p>
                              <p className="mt-1 text-[11px] text-[#5b5c72] leading-5">
                                {included ? "متضمنة مجانًا في باقتك الأساسية" : item.salesCue}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Quantity Stepper for unincluded addons */}
                        {!included && (
                          <div className="mt-3 flex items-center justify-between bg-white/70 rounded-xl p-1.5 border border-[#4046B5]/10">
                            <span className="text-[11px] font-extrabold text-[#07081A] px-1">الكمية المطلوبة:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setAddonQty(item.sku, Math.max(0, quantity - 1))}
                                disabled={quantity <= 0}
                                className="grid h-7 w-7 place-items-center rounded-lg bg-[#ECECF7] text-[#4046B5] transition hover:bg-[#dfe1fb] disabled:opacity-30 disabled:cursor-not-allowed"
                                title="إنقاص الكمية"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>

                              <span className="w-7 text-center font-[Inter] text-xs font-black text-[#07081A]" dir="ltr">
                                {quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => setAddonQty(item.sku, quantity + 1)}
                                className="grid h-7 w-7 place-items-center rounded-lg bg-[#4046B5] text-white transition hover:bg-[#343aa0] shadow-xs"
                                title="زيادة الكمية"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 border-t border-[#4046B5]/10 pt-2 flex items-center justify-between text-xs">
                        <span className={`text-[10px] font-bold ${isChecked ? "text-[#10B981]" : "text-[#64657a]"}`}>
                          {included
                            ? "بدون تكلفة إضافية"
                            : isChecked
                            ? `✓ مضاف (${quantity})`
                            : "+ غير محدد"}
                        </span>
                        <div className="text-left">
                          <span className={`font-[Inter] text-xs font-black ${included ? "text-[#10B981]" : isChecked ? "text-[#10B981]" : "text-[#4046B5]"}`} dir="ltr">
                            {included ? "مجاناً" : isChecked ? `+ ${formatEgp(lineTotal)}` : `+ ${formatEgp(unitPrice)}`}
                          </span>
                          {!included && isChecked && quantity > 1 && (
                            <p className="text-[9px] text-[#64657a]" dir="rtl">
                              ({quantity} × {formatEgp(unitPrice)})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 5: Payment Method */}
            <section className="mt-8 border-t border-[#4046B5]/10 pt-7">
              <h2 className="text-base font-extrabold text-[#07081A]">5. وسيلة الدفع المفضلة</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {paymentMethods.map((pm) => {
                  const isSelected = selectedPaymentMethod === pm.id;
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(pm.id)}
                      className={`flex flex-col justify-between rounded-2xl border p-4 text-right transition ${
                        isSelected
                          ? "border-[#4046B5] bg-[#ECECF7]/80 ring-2 ring-[#4046B5]/20"
                          : "border-[#4046B5]/12 bg-white hover:border-[#4046B5]/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <Icon className="h-5 w-5 text-[#4046B5]" />
                          <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[9px] font-black text-[#10B981]">
                            {pm.badge}
                          </span>
                        </div>
                        <p className="mt-3 text-xs font-black text-[#07081A]">{pm.name}</p>
                        <p className="mt-1 text-[10px] text-[#64657a]">{pm.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Submit Action Button */}
            <Button
              type="submit"
              disabled={createOrder.isPending || !quote.data}
              className="mt-9 h-14 w-full rounded-2xl bg-gradient-to-r from-[#4046B5] to-[#272d82] text-base font-black text-white shadow-lg shadow-[#4046B5]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#4046B5]/40 hover:scale-[1.01] active:scale-99"
            >
              {createOrder.isPending ? "جارٍ إعداد أمر الدفع..." : "متابعة لتأكيد الدفع التجريبي"}
              <LockKeyhole className="mr-2 h-4 w-4" />
            </Button>

            {createOrder.error && (
              <p className="mt-3 text-center text-xs font-bold text-destructive">
                {createOrder.error.message}
              </p>
            )}
          </form>

          {/* Sticky Order Summary Card */}
          <aside className="rounded-[2.2rem] border border-[#4046B5]/30 bg-gradient-to-b from-[#07081A] to-[#0A0B22] p-7 text-white shadow-[0_30px_60px_-15px_rgba(64,70,181,0.2)] lg:sticky lg:top-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="mof-stamp-white px-3 py-1 text-xs">ملخص أمر الشراء</span>
              <span className="text-xs font-bold text-[#b9bdff]">موفوتر 2026</span>
            </div>

            <div className="mt-6 border-b border-white/10 pb-6">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold text-[#d7d8ff]">
                {persona === "firm" ? "باقة مكتب محاسبة" : "باقة شركة"}
              </span>
              <h3 className="mt-3 text-2xl font-black text-white">{plan?.name}</h3>
              <p className="mt-1 text-xs text-white/60">{plan?.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-[#b9bdff]">
                <span>{plan?.files}</span>
                <span>•</span>
                <span>{plan?.users}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3.5 py-6 text-xs">
              <div className="flex justify-between">
                <span className="text-white/70">سعر الباقة الأساسي (سنوي):</span>
                <strong className="font-[Inter] text-sm font-extrabold" dir="ltr">
                  {plan ? formatEgp(plan.annualPiastres) : "…"}
                </strong>
              </div>

              {quote.data && quote.data.addons.length > 0 && (
                <div className="rounded-xl bg-white/[.04] p-3 text-[11px]">
                  <span className="font-bold text-[#b9bdff]">الإضافات المختارة:</span>
                  {quote.data.addons.map((item) => (
                    <div key={item.sku} className="mt-1.5 flex justify-between text-white/80">
                      <span>+ {item.name} {item.quantity > 1 ? `(×${item.quantity})` : ""}</span>
                      <span className="font-[Inter] font-bold" dir="ltr">
                        {formatEgp(item.lineTotalPiastres)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {quote.data && quote.data.discountPiastres > 0 && (
                <div className="flex justify-between text-[#38ef7d]">
                  <span className="flex items-center gap-1 font-bold">
                    <BadgePercent className="h-3.5 w-3.5" />
                    خصم العرض السنوي (10%):
                  </span>
                  <strong className="font-[Inter] text-sm font-extrabold" dir="ltr">
                    - {formatEgp(quote.data.discountPiastres)}
                  </strong>
                </div>
              )}

              <div className="flex justify-between text-white/70">
                <span>ضريبة القيمة المضافة (14% VAT):</span>
                <strong className="font-[Inter] text-sm font-extrabold" dir="ltr">
                  {quote.data ? formatEgp(quote.data.vatPiastres) : "…"}
                </strong>
              </div>
            </div>

            {/* Total Box */}
            <div className="rounded-2xl bg-gradient-to-r from-[#4046B5] to-[#272d82] p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold text-white/80">الإجمالي النهائي المطلوب</p>
                  <p className="text-[10px] text-white/60">شامل ضريبة القيمة المضافة 14%</p>
                </div>
                <strong className="font-[Inter] text-2xl font-black text-white" dir="ltr">
                  {quote.data ? formatEgp(quote.data.totalPiastres) : "…"}
                </strong>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-xs text-white/65">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#38ef7d] shrink-0" />
                ضمان ذهبي 14 يومًا لاسترجاع القيمة وفق الشروط.
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#38ef7d] shrink-0" />
                إصدار عقد إلكتروني وفاتورة ضريبية رسمية فورية.
              </p>
              <p className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[#38ef7d] shrink-0" />
                عملية تجريبية آمنة لا تتطلب بطاقة حقيقية في الـ PoC.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

