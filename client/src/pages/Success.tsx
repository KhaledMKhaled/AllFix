import content from "@/content/poc.ar.json";
import { Button } from "@/components/ui/button";
import { usePocTracking } from "@/hooks/usePocTracking";
import { formatEgp, PLANS } from "@shared/poc";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  HelpCircle,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
  UserCheck,
  CalendarCheck
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useEffect, useRef } from "react";

export default function Success() {
  const [, params] = useRoute("/success/:token");
  const [, setLocation] = useLocation();
  const token = params?.token ?? "";
  const track = usePocTracking();
  const purchaseTracked = useRef(false);
  const order = trpc.poc.getOrder.useQuery({ token }, { enabled: Boolean(token) });

  useEffect(() => {
    if (!order.data || order.data.status !== "PAID_DEMO" || purchaseTracked.current) return;
    purchaseTracked.current = true;
    track("purchase", { persona: order.data.persona as "firm" | "company", uiContext: "success", properties: { transaction_id: order.data.orderId, value: order.data.totalPiastres / 100, currency: "EGP", items: [{ item_id: order.data.planName, quantity: 1 }, ...(order.data.addons ?? []).map((addon) => ({ item_id: addon.sku, quantity: addon.quantity }))] } });
  }, [order.data, track]);

  if (order.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FBFBFF] text-[#4046B5]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 motion-safe:animate-spin rounded-full border-4 border-[#4046B5] border-t-transparent" />
          <p className="mt-4 text-sm font-extrabold text-[#07081A]">جارٍ تأكيد الاشتراك وتوليد إيصال السداد...</p>
        </div>
      </div>
    );
  }

  if (!order.data || order.data.status !== "PAID_DEMO") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FBFBFF] p-6 text-center text-[#07081A]">
        <div className="max-w-md rounded-3xl border border-destructive/20 bg-white p-8 shadow-sm">
          <HelpCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-extrabold">لا يمكن فتح صفحة النجاح قبل اعتماد الدفع</h1>
          <p className="mt-2 text-xs leading-6 text-[#5b5c72]">
            يرجى اعتماد الدفع التجريبي أولاً لتوليد إشعار الاشتراك والعقد.
          </p>
          <Link href="/checkout" className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#4046B5] px-6 text-xs font-extrabold text-white">الرجوع إلى صفحة الاشتراك</Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ECECF7] via-[#F8F8FC] to-[#ECECF7] py-10 px-4 text-[#07081A]">
      <div className="mx-auto max-w-2xl">
        {/* Top Logo */}
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <img src="/brand/mofawtar-badge-logo.png" alt="موفوتر" className="h-10 w-auto" />
          </Link>
        </div>

        {/* Main Success Card */}
        <div className="overflow-hidden rounded-[2.5rem] border border-[#4046B5]/15 bg-white p-8 md:p-11 shadow-[0_30px_90px_-35px_rgba(64,70,181,0.2)] text-center">
          {/* Animated Stamp Celebration */}
          <div className="relative mx-auto grid h-20 w-20 place-items-center">
            <div className="absolute inset-0 rounded-full bg-[#10B981]/20 animate-ping" />
            <div className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-tr from-[#059669] to-[#10B981] text-white shadow-[0_0_40px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          </div>

          <div className="mt-6">
            <span className="mof-stamp px-3 py-1 text-xs">عملية سداد معتمدة • تم بنجاح</span>
            <h1 className="mt-3 text-3xl font-black text-[#07081A]">{content.payment.successTitle}</h1>
            <p className="mt-3 text-xs leading-7 text-[#5b5c72]">
              أهلاً بك في عائلة موفوتر! تم تأكيد طلبك بنجاح وحجز مساحة عملك على السحابة الضريبية.
            </p>
          </div>

          {/* Stamped Receipt Box */}
          <div className="mt-8 rounded-3xl border border-[#4046B5]/20 bg-white p-6 text-right relative overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)]">
            {/* Official Stamp Watermark */}
            <img
              src="/brand/mofawtar-official-stamp.png"
              alt="ختم الاعتماد الرسمي"
              className="absolute left-3 -bottom-3 w-32 h-32 object-contain opacity-20 pointer-events-none -rotate-12"
            />

            <div className="absolute -top-3 -left-3 mof-stamp-badge rotate-12 text-[10px]">
              إيصال سداد إلكتروني
            </div>

            <div className="flex items-center justify-between border-b border-[#4046B5]/10 pb-4">
              <div>
                <p className="text-[11px] text-[#64657a]">رقم العملية المرجعي</p>
                <p className="font-[Inter] text-xs font-black text-[#4046B5]" dir="ltr">
                  {order.data.orderId}
                </p>
              </div>
              <div className="text-left">
                <p className="text-[11px] text-[#64657a]">تاريخ ووقت المعاملة</p>
                <p className="text-xs font-bold" dir="ltr">
                  {new Intl.DateTimeFormat("ar-EG-u-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(order.data.paidAt ?? order.data.expiresAt))}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#64657a]">اسم العميل / المنشأة:</span>
                <p className="font-extrabold text-[#07081A] mt-0.5">{order.data.customerName || "عميل موفوتر"}</p>
              </div>
              <div>
                <span className="text-[#64657a]">الباقة المختارة:</span>
                <p className="font-extrabold text-[#07081A] mt-0.5">{order.data.planName}</p>
              </div>
              <div>
                <span className="text-[#64657a]">دورة الفوترة:</span>
                <p className="font-extrabold text-[#07081A] mt-0.5">
                  اشتراك سنوي (12 شهرًا)
                </p>
              </div>
              <div>
                <span className="text-[#64657a]">المبلغ المسدد:</span>
                <p className="font-[Inter] text-sm font-black text-[#10B981] mt-0.5" dir="ltr">
                  {formatEgp(order.data.totalPiastres)}
                </p>
              </div>
              <div className="col-span-2 border-t border-[#4046B5]/10 pt-3">
                <div className="flex justify-between"><span className="text-[#64657a]">الإجمالي قبل الخصم:</span><strong>{formatEgp(order.data.subtotalPiastres)}</strong></div>
                <div className="mt-1 flex justify-between"><span className="text-[#64657a]">الخصم:</span><strong className="text-[#4046B5]">- {formatEgp(order.data.discountPiastres)}</strong></div>
                <div className="mt-1 flex justify-between"><span className="text-[#64657a]">ضريبة القيمة المضافة 14%:</span><strong>{formatEgp(order.data.vatPiastres)}</strong></div>
              </div>
              {order.data.addons && order.data.addons.length > 0 && (
                <div className="col-span-2 border-t border-[#4046B5]/10 pt-3">
                  <span className="text-[#64657a] block mb-1">الإضافات والخدمات المعتمدة:</span>
                  <div className="flex flex-wrap gap-2">
                    {order.data.addons.map((a) => (
                      <span key={a.sku || a.name} className="rounded-lg bg-[#4046B5]/10 px-2.5 py-1 text-[11px] font-bold text-[#4046B5]">
                        ✓ {a.name} {a.quantity > 1 ? `(العدد: ${a.quantity})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3-Step Next Action Guide */}
          <div className="mt-8 text-right">
            <p className="text-xs font-extrabold text-[#4046B5]">الخطوات التالية لتفعيل الحساب بالكامل:</p>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-3 rounded-2xl border border-[#4046B5]/15 bg-[#ECECF7]/60 p-3.5 text-xs">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#4046B5] font-black text-white text-[11px]">
                  1
                </span>
                <span className="font-bold text-[#07081A]">
                  توثيق وقبول العقد الإلكتروني للخدمة (الآن).
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#4046B5]/10 bg-white p-3.5 text-xs text-[#5b5c72]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#ECECF7] font-black text-[#4046B5] text-[11px]">
                  2
                </span>
                <span>هيوصلك ملخص الخطوات التالية على القناة المتاحة بعد المراجعة.</span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#4046B5]/10 bg-white p-3.5 text-xs text-[#5b5c72]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#ECECF7] font-black text-[#4046B5] text-[11px]">
                  3
                </span>
                <span>لو احتجت مساعدة، فريق الدعم يوضح لك الخطوة التالية.</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <Button
            onClick={() => setLocation(`/contract/${token}`)}
            className="mt-8 h-14 w-full rounded-2xl bg-gradient-to-r from-[#4046B5] to-[#272d82] text-base font-black text-white shadow-lg shadow-[#4046B5]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#4046B5]/40 hover:scale-[1.01] active:scale-95"
          >
            الانتقال لتوثيق العقد الإلكتروني الرسمي
            <ArrowLeft className="me-2 h-5 w-5" />
          </Button>

          <Button type="button" variant="outline" onClick={() => window.print()} className="mt-3 h-11 w-full rounded-xl border-[#4046B5]/20 text-xs font-black text-[#4046B5]">تنزيل / طباعة الإيصال</Button>

          {/* WhatsApp Concierge Support */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#64657a]">
            <a
              href="https://wa.me/201050996319"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#10B981] hover:underline"
            >
              <MessageCircle className="h-4 w-4" />
              تواصل مع مدير حسابك المباشر عبر واتساب
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

