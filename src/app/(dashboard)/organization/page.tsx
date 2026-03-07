import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockOrganizations } from "@/lib/mock-data";

export default async function OrganizationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const t = await getTranslations("organization");
  const isAdmin = session.user.role === "ADMIN";

  const org = mockOrganizations[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        {isAdmin && <Badge>{t("admin")}</Badge>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("name")}</p>
              <p className="font-medium">{org.name}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">{t("slug")}</p>
              <p className="font-mono text-sm">{org.slug}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("features")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.entries(org.features) as [string, boolean][]).map(
              ([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">
                    {t(`feature_${key}`)}
                  </span>
                  <Badge variant={enabled ? "default" : "outline"}>
                    {enabled ? t("enabled") : t("disabled")}
                  </Badge>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
