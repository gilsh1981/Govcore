import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listDecisions } from "@/services/decisions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DecisionStatusBadge } from "@/components/decisions/decision-status-badge";

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await getTranslations("decisions");
  const tStatus = await getTranslations("decisionStatuses");
  const { status } = await searchParams;

  const decisions = await listDecisions(
    session.user.orgId,
    status ? { status: status as "PROPOSED" | "APPROVED" | "REJECTED" | "ARCHIVED" } : undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {([undefined, "PROPOSED", "APPROVED", "REJECTED", "ARCHIVED"] as const).map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/decisions?status=${s}` : "/decisions"}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              status === s || (!status && !s)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s ? tStatus(s) : t("all")}
          </Link>
        ))}
      </div>

      {decisions.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("titleCol")}</TableHead>
              <TableHead>{t("meeting")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decisions.map((decision) => (
              <TableRow key={decision.id}>
                <TableCell>
                  <Link
                    href={`/decisions/${decision.id}`}
                    className="font-medium hover:underline"
                  >
                    {decision.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/meetings/${decision.meeting.id}`}
                    className="text-sm hover:underline"
                  >
                    {decision.meeting.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <DecisionStatusBadge status={decision.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
