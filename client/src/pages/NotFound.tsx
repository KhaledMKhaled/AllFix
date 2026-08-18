import { Button } from "@/components/ui/button";
import { usePocTracking } from "@/hooks/usePocTracking";
import { ArrowLeft, FileQuestion, Home, MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const track = usePocTracking();

  useEffect(() => {
    const previousTitle = document.title;
    const meta = document.querySelector('meta[name="robots"]') ?? document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    document.head.appendChild(meta);
    document.title = "الصفحة غير موجودة | موفوتر";
    track("not_found_viewed", { uiContext: "not_found", properties: { path: window.location.pathname } });
    return () => {
      document.title = previousTitle;
      if (meta.parentElement) meta.remove();
    };
  }, [track]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#ECECF7] via-[#F8F8FC] to-[#ECECF7] p-4 text-[#07081A]">
      <div className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-[#4046B5]/15 bg-white p-8 md:p-10 shadow-[0_30px_90px_-35px_rgba(64,70,181,0.25)] text-center">
        {/* Top Logo */}
        <Link href="/" className="inline-block mb-6">
          <img src="/brand/mofawtar-badge-logo.png" alt="مفوتر" className="h-9 w-auto mx-auto" />
        </Link>

        {/* 404 Stamp & Icon */}
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <div className="absolute inset-0 rounded-full bg-[#4046B5]/10 motion-safe:animate-pulse" />
          <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-[#ECECF7] text-[#4046B5] shadow-xs">
            <FileQuestion className="h-10 w-10" />
          </div>
        </div>

        <div className="mt-6">
          <span className="mof-stamp px-3 py-0.5 text-xs font-black">خطأ 404 • ملف غير موجود</span>
          <h1 className="mt-3 text-2xl md:text-3xl font-black text-[#07081A]">
            الصفحة دي مش موجودة في دفاتر موفوتر
          </h1>
          <p className="mt-3 text-xs leading-7 text-[#5b5c72]">
            الصفحة اللي بتدور عليها مش موجودة أو تم نقلها لمكان تاني.
            <br />
            تقدر ترجع للرئيسية وتكمل شغلك الضريبي بكل سهولة.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="h-12 flex-1 rounded-2xl bg-[#4046B5] text-xs font-black text-white shadow-md shadow-[#4046B5]/25 hover:bg-[#343aa0]"
          >
            <Link href="/">
            <Home className="h-4 w-4 ml-2" />
            الرجوع للصفحة الرئيسية
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-12 rounded-2xl border-[#4046B5]/20 bg-[#FBFBFF] text-xs font-bold text-[#4046B5] hover:bg-[#ECECF7]"><Link href="/companies#pricing">استعراض باقات الشركات</Link></Button>
        </div>

        {/* Quick Help */}
        <div className="mt-8 border-t border-[#4046B5]/10 pt-5">
          <a
            href="https://wa.me/201050996319"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981] hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            محتاج مساعدة؟ تواصل مع الدعم الفني على واتساب
          </a>
        </div>
      </div>
    </div>
  );
}

