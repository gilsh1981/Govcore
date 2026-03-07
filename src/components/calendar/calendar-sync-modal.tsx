"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

export function CalendarSyncButton() {
  const t = useTranslations("calendarSync");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="me-2 h-4 w-4" />
          {t("syncCalendar")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between" disabled>
              <span>{t("outlook")}</span>
              <Badge variant="secondary">{t("comingSoon")}</Badge>
            </Button>
            <Button variant="outline" className="w-full justify-between" disabled>
              <span>{t("gmail")}</span>
              <Badge variant="secondary">{t("comingSoon")}</Badge>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
