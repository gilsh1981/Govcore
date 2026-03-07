"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateDecisionDialog({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const t = useTranslations("createDecision");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const dueDate = formData.get("dueDate") as string;

    const res = await fetch("/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        body: formData.get("body") || undefined,
        meetingId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      }),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("trigger")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              {t("titleLabel")}
            </label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="body" className="text-sm font-medium">
              {t("descriptionLabel")}
            </label>
            <Textarea id="body" name="body" />
          </div>
          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium">
              {t("dueDateLabel")}
            </label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
