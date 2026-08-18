import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import content from "@/content/poc.ar.json";
import { trpc } from "@/lib/trpc";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  ArrowRight,
  Download,
  FileCheck2,
  FileText,
  Loader2,
  Printer,
  ShieldCheck,
  Building,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";

export default function Contract() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/contract/:token");
  const token = params?.token ?? "";
  const order = trpc.poc.getOrder.useQuery({ token }, { enabled: Boolean(token) });
  const contract = trpc.poc.getContract.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const create = trpc.poc.createContract.useMutation({ onSuccess: () => void contract.refetch() });
  const documentRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const returnToSuccess = () => setLocation(`/success/${token}`);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      token,
      details: {
        customerName: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
        taxCard: String(form.get("taxCard") ?? ""),
        nationalId: String(form.get("nationalId") ?? ""),
        commercialRegister: String(form.get("commercialRegister") ?? ""),
        address: String(form.get("address") ?? ""),
        consent: true as const,
      },
    });
  };

  const exportPdf = async (openForPrint = false) => {
    if (!documentRef.current || !contract.data) return;
    setPdfBusy(true);
    try {
      const pages = Array.from(documentRef.current.querySelectorAll<HTMLElement>(".pdf-page"));
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: pages[index].scrollWidth,
        });
        if (index > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297, undefined, "FAST");
      }
      if (openForPrint) {
        const url = URL.createObjectURL(pdf.output("blob"));
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      } else {
        pdf.save(`${contract.data.contractNumber}.pdf`);
      }
    } finally {
      setPdfBusy(false);
    }
  };

  if (order.isLoading || contract.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FBFBFF] text-[#4046B5]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 motion-safe:animate-spin rounded-full border-4 border-[#4046B5] border-t-transparent" />
          <p className="mt-4 text-sm font-extrabold text-[#07081A]">جارٍ تحميل العقد والبيانات التعاقدية...</p>
        </div>
      </div>
    );
  }

  if (order.error || !order.data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FBFBFF] p-6 text-center text-[#07081A]">
        <div className="max-w-md rounded-3xl border border-destructive/20 bg-white p-8 shadow-sm">
          <p className="font-extrabold text-lg text-destructive">تعذر العثور على الطلب</p>
          <p className="mt-2 text-xs text-[#5b5c72]">ارجع إلى صفحة الدفع التجريبي وافتح رابط العقد من جديد.</p>
          <button type="button" onClick={() => setLocation("/checkout")} className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#4046B5] px-6 text-xs font-extrabold text-white">الرجوع للبداية</button>
        </div>
      </div>
    );
  }

  if (order.data.status !== "PAID_DEMO") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FBFBFF] p-6 text-center text-[#07081A]">
        <div className="max-w-md rounded-3xl border border-destructive/20 bg-white p-8 shadow-sm">
          <p className="font-extrabold text-lg">العقد متاح بعد اعتماد الدفع التجريبي فقط</p>
          <Button onClick={returnToSuccess} className="mt-6 rounded-xl bg-[#4046B5]">
            الرجوع لاعتماد الدفع
          </Button>
        </div>
      </div>
    );
  }

  if (contract.error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FBFBFF] p-6 text-center text-[#07081A]">
        <div className="max-w-md rounded-3xl border border-destructive/20 bg-white p-8 shadow-sm">
          <p className="font-extrabold text-lg text-destructive">تعذر فتح العقد الآن</p>
          <p className="mt-2 text-xs text-[#5b5c72]">يرجى إعادة المحاولة بعد لحظات.</p>
          <Button onClick={() => void contract.refetch()} className="mt-6 rounded-xl bg-[#4046B5]">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (contract.data) {
    return (
      <div className="min-h-screen bg-[#ECECF7] py-6 md:py-10 text-[#07081A]">
        <div className="container max-w-7xl">
          {/* Top Bar */}
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-[#4046B5]/12 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-5">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={returnToSuccess}
                className="h-10 rounded-xl border-[#4046B5]/20 bg-[#FBFBFF] text-xs font-bold text-[#4046B5] hover:bg-[#ECECF7]"
              >
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة لصفحة النجاح
              </Button>
              <div className="hidden h-6 w-px bg-[#4046B5]/15 md:block" />
              <p className="text-xs font-bold text-[#61627a]">
                نموذج عقد تجريبي • جاهز للمراجعة والطباعة والتنزيل
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#10B981]">
              <ShieldCheck className="h-4 w-4" />
              نسخة PoC غير نافذة قانونيًا
            </div>
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[1fr_20rem]">
            {/* Contract Viewer Card */}
            <section className="overflow-hidden rounded-[2.5rem] border border-[#4046B5]/15 bg-white shadow-xl">
              <div className="flex flex-col gap-4 border-b border-[#4046B5]/10 bg-gradient-to-l from-[#07081A] to-[#272d82] p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white shadow-xs">
                    <FileCheck2 className="h-6 w-6" />
                  </span>
                  <div>
                    <span className="mof-stamp-white px-2 py-0.5 text-[10px]">عقد اشتراك SaaS</span>
                    <h1 className="mt-1 font-[Inter] text-xl font-black" dir="ltr">
                      {contract.data.contractNumber}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Button
                    disabled={pdfBusy}
                    onClick={() => void exportPdf(true)}
                    variant="outline"
                    className="rounded-xl border-white/30 bg-white/10 text-xs font-bold text-white hover:bg-white hover:text-[#4046B5]"
                  >
                    <Printer className="ml-2 h-4 w-4" />
                    معاينة للطباعة
                  </Button>
                  <Button
                    disabled={pdfBusy}
                    onClick={() => void exportPdf(false)}
                    className="rounded-xl bg-white text-xs font-black text-[#4046B5] hover:bg-[#ECECF7]"
                  >
                    {pdfBusy ? <Loader2 className="ml-2 h-4 w-4 motion-safe:animate-spin" /> : <Download className="ml-2 h-4 w-4" />}
                    تنزيل PDF
                  </Button>
                </div>
              </div>

              {/* Scrollable Document Container */}
              <div className="bg-[#DFE1ED] p-3 md:p-6">
                <div className="max-h-[76vh] overflow-auto rounded-2xl border border-[#C9CCDB] bg-[#CFD2DF] p-2 md:p-4 shadow-inner">
                  <div
                    ref={documentRef}
                    className="contract-document mx-auto w-fit shadow-md rounded-sm"
                    dangerouslySetInnerHTML={{ __html: contract.data.html }}
                  />
                </div>
              </div>
            </section>

            {/* Sidebar Next Steps */}
            <aside className="rounded-[2rem] border border-[#4046B5]/12 bg-white p-6 shadow-md xl:sticky xl:top-24">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ECECF7] text-[#4046B5]">
                <FileText className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-black text-[#07081A]">الخطوات والإرشادات</h2>

              <div className="mt-5 space-y-4 border-r-2 border-[#4046B5]/20 pr-4">
                <div>
                  <p className="text-xs font-black text-[#4046B5]">01 · التحقق والاحتفاظ</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#606178]">
                    تأكد من مطابقة بيانات السجل والبطاقة الضريبية ثم احتفظ بالملف.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black text-[#4046B5]">02 · تنزيل نسخة PDF</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#606178]">
                    هذه نسخة PDF تجريبية للمراجعة وليست اعتمادًا قانونيًا نهائيًا.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black text-[#4046B5]">03 · لوحة التحكم</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#606178]">
                    يمكنك استعراض التقارير وإحصائيات المنظومة من خلال لوحة المتابعة.
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[#4046B5]/10 pt-5">
                <button type="button" onClick={() => setLocation("/dashboard")} className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#4046B5] text-xs font-black text-white hover:bg-[#343aa0]">
                  فتح لوحة تحكم المنظومة
                  <ExternalLink className="me-2 h-4 w-4" />
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // Contract Generation Form View
  return (
    <div className="min-h-screen bg-[#FBFBFF] py-8 md:py-12 text-[#07081A]">
      <div className="container max-w-3xl">
        <Button
          variant="outline"
          onClick={returnToSuccess}
          className="mb-6 rounded-xl border-[#4046B5]/20 text-xs font-bold text-[#4046B5] hover:bg-[#ECECF7]"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة لتأكيد الدفع
        </Button>

        <div className="rounded-[2.5rem] border border-[#4046B5]/12 bg-white p-7 shadow-sm md:p-10">
          <p className="mof-eyebrow">استكمال توثيق العقد الإلكتروني</p>
          <h1 className="mt-2 text-3xl font-black text-[#07081A]">{content.contract.title}</h1>
          <p className="mt-3 text-xs leading-6 text-[#5b5c72]">{content.contract.body}</p>

          <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="contract-name" className="text-xs font-bold">
                {content.checkout.name} *
              </Label>
              <Input
                id="contract-name"
                name="name"
                defaultValue={order.data.customerName}
                required
                className="h-11 rounded-xl border-[#4046B5]/20 text-xs"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="contract-email" className="text-xs font-bold">
                {content.checkout.email} *
              </Label>
              <Input
                id="contract-email"
                name="email"
                type="email"
                required
                dir="ltr"
                defaultValue={order.data.email}
                placeholder="name@company.com"
                className="h-11 rounded-xl border-[#4046B5]/20 text-xs"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="contract-phone" className="text-xs font-bold">
                {content.checkout.phone} *
              </Label>
              <Input
                id="contract-phone"
                name="phone"
                type="tel"
                required
                dir="ltr"
                defaultValue={order.data.phone}
                pattern="01[0125][0-9]{8}"
                maxLength={11}
                placeholder="01xxxxxxxxx"
                className="h-11 rounded-xl border-[#4046B5]/20 text-xs"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="tax-card" className="text-xs font-bold">
                {content.contract.taxCard} (اختياري)
              </Label>
              <Input
                id="tax-card"
                name="taxCard"
                placeholder="رقم البطاقة الضريبية 9 أرقام"
                className="h-11 rounded-xl border-[#4046B5]/20 text-xs"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="national-id" className="text-xs font-bold">
                {content.contract.nationalId} (اختياري)
              </Label>
              <Input
                id="national-id"
                name="nationalId"
                placeholder="الرقم القومي للمفوض 14 رقم"
                className="h-11 rounded-xl border-[#4046B5]/20 text-xs"
              />
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="commercial" className="text-xs font-bold">
                {content.contract.commercialRegister} (اختياري)
              </Label>
              <Input
                id="commercial"
                name="commercialRegister"
                placeholder="رقم السجل التجاري"
                className="h-11 rounded-xl border-[#4046B5]/20 text-xs"
              />
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="address" className="text-xs font-bold">
                {content.contract.address}
              </Label>
              <Textarea
                id="address"
                name="address"
                placeholder="العنوان التفصيلي للشركة أو المكتب (المحافظة، الحي، الشارع، المبنى)"
                className="rounded-xl border-[#4046B5]/20 text-xs"
                rows={3}
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-[#4046B5]/15 bg-[#ECECF7]/60 p-4 text-xs leading-6 text-[#33344e] sm:col-span-2">
              <Checkbox name="consent" required />
              <span>أقر أنني أراجع بياناتي بنفسي، وأفهم أن هذه الشاشة تنتج نموذج PoC تجريبيًا غير نافذ قانونيًا قبل المراجعة والتوقيع الفعلي.</span>
            </label>

            <Button
              type="submit"
              disabled={create.isPending}
              className="sm:col-span-2 mt-4 h-13 rounded-2xl bg-[#4046B5] text-sm font-black text-white shadow-lg shadow-[#4046B5]/30 hover:bg-[#343aa0]"
            >
              {create.isPending && <Loader2 className="ml-2 h-4 w-4 motion-safe:animate-spin" />}
              {content.contract.create}
            </Button>

            {create.error && (
              <p aria-live="polite" className="sm:col-span-2 text-center text-xs font-bold text-destructive">تعذر توليد النموذج. راجع البيانات والموافقة ثم جرّب مرة أخرى.</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

