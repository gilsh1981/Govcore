"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();

  function switchLocale() {
    const newLocale = locale === "he" ? "en" : "he";
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={switchLocale}>
      {locale === "he" ? "English" : "עברית"}
    </Button>
  );
}
