import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const REPORT_KEYS = [
  "meetingSummary",
  "decisionTracking",
  "attendanceReport",
  "committeeDashboard",
] as const;

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const t = await getTranslations("reports");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {REPORT_KEYS.map((key) => (
          <Card key={key} className="relative">
            <CardHeader>
              <CardTitle className="text-base">{t(key)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t(`${key}Desc`)}</p>
            </CardContent>
            <Badge variant="secondary" className="absolute top-4 end-4">
              {t("comingSoon")}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
