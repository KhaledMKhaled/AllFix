import content from "@/content/poc.ar.json";
import { usePocTracking } from "@/hooks/usePocTracking";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";

export default function PaymentProcessing() {
  const [, params] = useRoute("/payment-processing/:token");
  const [, setLocation] = useLocation();
  const token = params?.token ?? "";
  const track = usePocTracking();
  const startedAt = useRef(Date.now());
  const completionTracked = useRef(false);
  const order = trpc.poc.getOrder.useQuery({ token }, { enabled: Boolean(token), refetchInterval: (query) => query.state.data?.status === "PAID_DEMO" ? false : 500, retry: false });

  useEffect(() => {
    if (!token) return;
    track("payment_processing_started", { uiContext: "payment_processing", properties: { tokenPresent: true } });
  }, [token, track]);

  useEffect(() => {
    if (order.data?.status === "PAID_DEMO" && !completionTracked.current) {
      completionTracked.current = true;
      track("payment_processing_completed", { persona: order.data.persona as "firm" | "company", uiContext: "payment_processing", properties: { durationMs: Date.now() - startedAt.current } });
      setLocation(`/success/${token}`);
    }
  }, [order.data, setLocation, token, track]);

  const step = order.data?.status === "PAID_DEMO" ? 3 : order.data ? 1 : 0;

  if (!token || order.error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07081A] p-6 text-center text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-[#101132] p-8">
          <h1 className="text-xl font-black">تعذر متابعة عملية الدفع</h1>
          <p className="mt-3 text-sm leading-7 text-white/70">الرابط غير صالح أو انتهت صلاحيته. احتفظ برقم طلبك وتواصل معنا على 01050996319 للمساعدة.</p>
          <button type="button" onClick={() => setLocation("/checkout")} className="mt-6 rounded-xl bg-[#4046B5] px-5 py-3 text-sm font-black">الرجوع للطلب</button>
        </div>
      </div>
    );
  }

  const steps = [
    { label: "استلام طلب تأكيد السداد", done: step >= 1 },
    { label: "تجهيز ملخص المعاملة", done: step >= 3 },
    { label: "تجهيز مساحة العمل", done: step >= 3 },
  ];

  return (
    <div role="status" aria-live="polite" className="grid min-h-screen place-items-center bg-[#07081A] p-5 text-center text-white">
      <div className="mx-auto w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#101132] p-8 shadow-2xl">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#4046B5]/30 motion-safe:animate-ping" />
          <Loader2 className="absolute h-20 w-20 motion-safe:animate-spin text-[#7D82EB]" />
          <ShieldCheck className="h-9 w-9 text-white" />
        </div>

        <h1 className="mt-8 text-2xl font-black">{content.payment.processing}</h1>
        <p className="mt-2 text-xs leading-6 text-white/60">
          {order.data?.persona === "firm" ? "ثواني وبنجهّز مساحة عمل مكتبك." : "ثواني وبنجهّز مساحة عملك."}
        </p>

        <div className="mt-8 space-y-3 text-right">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 rounded-xl border p-3 text-xs font-bold transition-all duration-300 ${
                item.done
                  ? "border-[#10B981]/40 bg-[#10B981]/15 text-[#38ef7d]"
                  : "border-white/10 bg-white/[.03] text-white/45"
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${
                  item.done ? "bg-[#10B981] text-white" : "bg-white/10 text-white/40"
                }`}
              >
                {item.done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

