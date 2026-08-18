import { usePocTracking } from "@/hooks/usePocTracking";
import { Button } from "@/components/ui/button";
import { resolvePersona, type Persona } from "@shared/poc";
import { ArrowLeft, Building2, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

const choices: Array<{
  persona: Persona;
  href: string;
  title: string;
  description: string;
  Icon: typeof UsersRound;
}> = [
  {
    persona: "firm",
    href: "/accounting-offices",
    title: "عندي مكتب محاسبة",
    description: "بدير ملفات ضريبية لأكتر من عميل وفريق بيتابع معايا.",
    Icon: UsersRound,
  },
  {
    persona: "company",
    href: "/companies",
    title: "عندي شركة أو بشتغل لحسابي",
    description: "بنظم ملف ضريبي واحد وعمليات يومية من غير لخبطة.",
    Icon: Building2,
  },
];

export default function PersonaGate() {
  const [, setLocation] = useLocation();
  const track = usePocTracking();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const persona = resolvePersona(params.get("persona") ?? params.get("p"));
    if (persona) {
      localStorage.setItem("mof_persona", persona);
      track("persona_resolved", { persona, uiContext: "query_gate_bypass" });
      setLocation(persona === "firm" ? "/accounting-offices" : "/companies");
      return;
    }
    track("persona_gate_shown", { uiContext: "persona_gate" });
  }, [setLocation, track]);

  const choosePersona = (persona: Persona, href: string) => {
    localStorage.setItem("mof_persona", persona);
    sessionStorage.setItem("mof_persona", persona);
    track("persona_selected", { persona, uiContext: "persona_gate" });
    setLocation(href);
  };

  return (
    <main className="min-h-screen bg-[#ECECF7] px-4 py-8 text-[#07081A] sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
            <img src="/brand/mofawtar-badge-logo.png" alt="موفوتر" className="h-12 w-auto" />
          </Link>
          <p className="mof-eyebrow mt-8">منصة موفوتر</p>
          <h1 className="mt-3 font-jomhuria text-5xl leading-none md:text-7xl">انت بتدير ملفات عملاء، ولا ملف شركتك؟</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#5B5C72] md:text-lg">
            اختار المسار الأقرب لشغلك، وشوف الباقات والشرح اللي يخصك من أول شاشة.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {choices.map(({ persona, href, title, description, Icon }) => (
            <button
              key={persona}
              type="button"
              onClick={() => choosePersona(persona, href)}
              className="group rounded-[2rem] border border-[#4046B5]/15 bg-white p-7 text-start shadow-[0_24px_60px_-38px_rgba(64,70,181,0.45)] transition hover:-translate-y-1 hover:border-[#4046B5]/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4046B5]"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#4046B5] text-white shadow-md shadow-[#4046B5]/20">
                <Icon className="h-7 w-7" />
              </span>
              <h2 className="mt-7 text-2xl font-extrabold">{title}</h2>
              <p className="mt-3 min-h-14 text-sm leading-7 text-[#5B5C72]">{description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#4046B5]">
                شوف النسخة المناسبة
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
              </span>
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[#64657A]">
          مش متأكد؟ ابدأ من نسخة الشركات، وتقدر تبدّل في أي وقت.
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild variant="ghost" className="text-[#4046B5]">
            <Link href="/companies">ابدأ من نسخة الشركات</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
