import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getDecision } from "@/services/decisions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DecisionStatusBadge } from "@/components/decisions/decision-status-badge";
import { DecisionStatusActions } from "@/components/decisions/decision-status-actions";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await getTranslations("decisionDetail");
  const locale = await getLocale();
  const { id } = await params;
  const decision = await getDecision(session.user.orgId, id);
  if (!decision) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/decisions"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; {t("backLink")}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-3xl font-bold">{decision.title}</h1>
          <DecisionStatusBadge status={decision.status} />
        </div>
        <p className="mt-1 text-muted-foreground">
          {t("from")}{" "}
          <Link
            href={`/meetings/${decision.meeting.id}`}
            className="hover:underline"
          >
            {decision.meeting.title}
          </Link>
        </p>
      </div>

      <DecisionStatusActions
        decisionId={decision.id}
        currentStatus={decision.status}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Description */}
        {decision.description && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t("descriptionTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{decision.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t("detailsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("createdByLabel")}</p>
              <p className="text-sm">
                {decision.createdBy
                  ? decision.createdBy.name || decision.createdBy.email
                  : "—"}
              </p>
            </div>
            {decision.proposedBy && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">{t("proposedByLabel")}</p>
                  <p className="text-sm">
                    {decision.proposedBy.name || decision.proposedBy.email}
                  </p>
                </div>
              </>
            )}
            {decision.approvedBy && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">{t("approvedByLabel")}</p>
                  <p className="text-sm">
                    {decision.approvedBy.name || decision.approvedBy.email}
                    {decision.approvedAt && (
                      <span className="ml-2 text-muted-foreground">
                        · {new Date(decision.approvedAt).toLocaleDateString(locale)}
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle>{t("timelineTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("createdLabel")}</p>
              <p className="text-sm">
                {new Date(decision.createdAt).toLocaleString(locale)}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">{t("lastUpdatedLabel")}</p>
              <p className="text-sm">
                {new Date(decision.updatedAt).toLocaleString(locale)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
