import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageToggle } from "@/components/layout/language-toggle";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("nameLabel")}</p>
              <p className="font-medium">{session.user.name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("emailLabel")}</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("roleLabel")}</p>
              <p className="font-medium">{session.user.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("photo")}</p>
              <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold">
                {session.user.name?.charAt(0) || "U"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t("language")}</p>
              <LanguageToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
