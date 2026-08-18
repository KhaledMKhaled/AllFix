import content from "@/content/poc.ar.json";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ChartNoAxesCombined,
  CircleAlert,
  FileText,
  UsersRound,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { useState } from "react";

const labels: Record<string, string> = {
  page_view: "زيارة الصفحة الرئيسية",
  persona_resolved: "تحديد الشخصية (مكتب / شركة)",
  pricing_viewed: "استعراض جدول الأسعار",
  plan_selected: "اختيار باقة اشتراك",
  checkout_started: "بدء إتمام الطلب Checkout",
  order_created: "توليد أمر الشراء",
  purchase_completed: "اعتماد الدفع التجريبي",
  contract_generated: "توليد نموذج العقد التجريبي",
  contract_downloaded: "تنزيل نسخة PDF للنموذج",
  persona_gate_shown: "عرض بوابة اختيار المسار",
  payment_page_viewed: "عرض صفحة الدفع التجريبية",
  payment_processing_started: "بدء متابعة حالة الدفع",
  payment_processing_completed: "اكتمال الدفع التجريبي",
  purchase: "تسجيل تحويل تجريبي",
};

export default function Dashboard() {
  const dashboard = trpc.poc.dashboard.useQuery();
  const data = dashboard.data;
  const [activePersonaFilter, setActivePersonaFilter] = useState<string>("all");

  const cards = data
    ? [
        {
          label: content.dashboard.visitors,
          value: data.overview.visitors,
          icon: UsersRound,
          trend: "إجمالي الزوار المسجلين",
          color: "text-[#4046B5] bg-[#ECECF7]",
        },
        {
          label: content.dashboard.leads,
          value: data.overview.leads,
          icon: Activity,
          trend: "إجمالي العملاء المحتملين",
          color: "text-[#10B981] bg-[#ECFDF5]",
        },
        {
          label: content.dashboard.paid,
          value: data.overview.paid,
          icon: ChartNoAxesCombined,
          trend: "دفعات PoC معتمدة",
          color: "text-[#F59E0B] bg-[#FFFBEB]",
        },
        {
          label: content.dashboard.contracts,
          value: data.overview.contracts,
          icon: FileText,
          trend: "نماذج عقود مولّدة",
          color: "text-[#8B5CF6] bg-[#F5F3FF]",
        },
      ]
    : [];

  const filteredEvents =
    data?.recentEvents.filter((ev) => {
      if (activePersonaFilter === "all") return true;
      return ev.persona === activePersonaFilter;
    }) ?? [];

  return (
    <DashboardLayout>
      <div dir="rtl" className="mx-auto max-w-7xl py-4 md:py-6 text-[#07081A]">
        {/* Top Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-[#4046B5]/10 pb-5">
          <div>
            <span className="mof-stamp px-3 py-0.5 text-xs font-black">لوحة المتابعة والتحليلات {new Date().getFullYear()}</span>
            <h1 className="mt-2 text-2xl md:text-3xl font-black">{content.dashboard.title}</h1>
            <p className="mt-1 text-xs text-[#5b5c72]">{content.dashboard.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-[#F59E0B]/30 bg-[#FFFBEB] px-3.5 py-1.5 text-xs font-black text-[#92400E]">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
              وضع تجريبي — مؤشرات مشتقة من بيانات PoC
            </span>
          </div>
        </div>

        {dashboard.isLoading ? (
          <div className="mt-12 text-center text-[#4046B5]">
            <div className="mx-auto h-10 w-10 motion-safe:animate-spin rounded-full border-4 border-[#4046B5] border-t-transparent" />
            <p className="mt-3 text-xs font-bold">جارٍ تحميل مؤشرات التحويل ومسار العملاء...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.label}
                    className="rounded-3xl border border-[#4046B5]/12 bg-white p-5 shadow-xs transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${card.color}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-[Inter] text-3xl font-black text-[#07081A]" dir="ltr">
                        {card.value}
                      </span>
                    </div>
                    <p className="mt-4 text-xs font-extrabold text-[#5b5c72]">{card.label}</p>
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                      <TrendingUp className="h-3 w-3" />
                      <span>{card.trend}</span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Main Conversion Funnel & Sources Grid */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              {/* Funnel Section */}
              <section className="rounded-3xl border border-[#4046B5]/12 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#4046B5]/10 pb-4">
                  <h2 className="text-base font-black text-[#07081A]">{content.dashboard.funnel}</h2>
                  <span className="text-xs font-bold text-[#64657a]">معدل الاستكمال عبر المراحل</span>
                </div>

                <div className="mt-6 space-y-4">
                  {data?.funnel.map((item, index) => {
                    const topValue = Math.max(1, data.funnel[0]?.value ?? 1);
                    const percentage = Math.round((item.value / topValue) * 100);

                    return (
                      <div key={item.name} className="relative">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-bold text-[#07081A]">{labels[item.name] ?? item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-[Inter] font-extrabold text-[#4046B5]">{item.value}</span>
                            <span className="text-[10px] text-[#8e90a8] font-[Inter]">({percentage}%)</span>
                          </div>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-[#ECECF7]">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-[#4046B5] to-[#7D82EB] transition-all duration-500"
                            style={{ width: `${Math.max(3, Math.min(100, percentage))}%` }}
                          />
                        </div>

                        {index < (data?.funnel.length ?? 0) - 1 && (
                          <div className="mr-3 my-1 h-2 border-r border-dashed border-[#4046B5]/30" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Traffic Sources & Health */}
              <section className="rounded-3xl border border-[#4046B5]/12 bg-white p-6 shadow-xs">
                <div className="border-b border-[#4046B5]/10 pb-4">
                  <h2 className="text-base font-black text-[#07081A]">{content.dashboard.sources}</h2>
                </div>

                <div className="mt-5 space-y-3">
                  {data?.sources.length ? (
                    data.sources.map((source) => (
                      <div
                        key={source.source}
                        className="flex items-center justify-between rounded-xl bg-[#FBFBFF] p-3 border border-[#4046B5]/10"
                      >
                        <span className="text-xs font-bold text-[#07081A]">{source.source}</span>
                        <span className="rounded-lg bg-[#ECECF7] px-3 py-1 font-[Inter] text-xs font-black text-[#4046B5]">
                          {source.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#64657a]">ستظهر مصادر الزيارات بعد تسجيل الزيارات في الـPoC.</p>
                  )}
                </div>

                {/* Health Box */}
                <div className="mt-6 border-t border-[#4046B5]/10 pt-5">
                  <h3 className="flex items-center gap-2 text-xs font-black text-[#07081A]">
                    <CircleAlert className="h-4 w-4 text-[#4046B5]" />
                    {content.dashboard.health}
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5b5c72]">
                    <div className="rounded-xl bg-[#ECECF7]/60 p-2.5">
                      <p className="text-[10px]">أحداث مرفوضة</p>
                      <strong className="font-[Inter] text-sm text-[#07081A]">{data?.health.rejected}</strong>
                    </div>
                    <div className="rounded-xl bg-[#ECECF7]/60 p-2.5">
                      <p className="text-[10px]">أحداث مكررة</p>
                      <strong className="font-[Inter] text-sm text-[#07081A]">{data?.health.duplicates}</strong>
                    </div>
                    <div className="rounded-xl bg-[#ECECF7]/60 p-2.5">
                      <p className="text-[10px]">زيارات بدون UTM</p>
                      <strong className="font-[Inter] text-sm text-[#07081A]">{data?.health.missingUtmRate}%</strong>
                    </div>
                    <div className="rounded-xl bg-[#ECECF7]/60 p-2.5">
                      <p className="text-[10px]">حالة Analytics</p>
                      <strong className="font-[Inter] text-sm text-[#10B981]">{data?.health.analyticsStatus}</strong>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Recent Events Log Table */}
            <section className="mt-6 rounded-3xl border border-[#4046B5]/12 bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4046B5]/10 pb-4">
                <h2 className="text-base font-black text-[#07081A]">{content.dashboard.events}</h2>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                  <button
                    aria-pressed={activePersonaFilter === "all"}
                    onClick={() => setActivePersonaFilter("all")}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                      activePersonaFilter === "all"
                        ? "bg-[#4046B5] text-white"
                        : "bg-[#ECECF7] text-[#5b5c72] hover:bg-[#dfe1ed]"
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    aria-pressed={activePersonaFilter === "firm"}
                    onClick={() => setActivePersonaFilter("firm")}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                      activePersonaFilter === "firm"
                        ? "bg-[#4046B5] text-white"
                        : "bg-[#ECECF7] text-[#5b5c72] hover:bg-[#dfe1ed]"
                    }`}
                  >
                    مكاتب المحاسبة
                  </button>
                  <button
                    aria-pressed={activePersonaFilter === "company"}
                    onClick={() => setActivePersonaFilter("company")}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                      activePersonaFilter === "company"
                        ? "bg-[#4046B5] text-white"
                        : "bg-[#ECECF7] text-[#5b5c72] hover:bg-[#dfe1ed]"
                    }`}
                  >
                    الشركات
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[650px] text-right text-xs">
                  <thead className="border-b border-[#4046B5]/10 text-[#64657a]">
                    <tr>
                      <th className="pb-3 font-bold">اسم الحدث</th>
                      <th className="pb-3 font-bold">الصفحة / المسار</th>
                      <th className="pb-3 font-bold">الشخصية المستهدفة</th>
                      <th className="pb-3 font-bold">التوقيت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length ? (
                      filteredEvents.map((event, index) => (
                        <tr key={`${event.eventName}-${index}`} className="border-b border-[#4046B5]/5 hover:bg-[#FBFBFF]">
                          <td className="py-3.5 font-bold text-[#07081A]">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#4046B5]" />
                              {labels[event.eventName] ?? event.eventName}
                            </span>
                          </td>
                          <td className="py-3.5 font-[Inter] text-[#5b5c72]" dir="ltr">
                            {event.pagePath}
                          </td>
                          <td className="py-3.5">
                            {event.persona === "firm" ? (
                              <span className="rounded-full bg-[#ECECF7] px-2.5 py-0.5 font-bold text-[#4046B5]">
                                مكتب محاسبة
                              </span>
                            ) : event.persona === "company" ? (
                              <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 font-bold text-[#065F46]">
                                شركة / نشاط
                              </span>
                            ) : (
                              <span className="text-[#8e90a8]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 text-[#64657a]" dir="ltr">
                            {event.createdAt ? new Date(event.createdAt).toLocaleTimeString("ar-EG") : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-[#64657a]">
                          لا توجد أحداث مسجلة بعد لهذا الفلتر.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

