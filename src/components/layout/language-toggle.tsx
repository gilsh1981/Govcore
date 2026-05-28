"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();

  function switchLocale() {
    const next = locale === "he" ? "en" : "he";
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <button
      onClick={switchLocale}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
    >
      <Languages className="h-[15px] w-[15px] shrink-0 text-slate-400" />
      <span>{locale === "he" ? "English" : "עברית"}</span>
    </button>
  );
}
