import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listCommittees } from "@/services/committees";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CommitteesPageActions } from "@/components/committees/committees-page-actions";

export default async function CommitteesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await getTranslations("committees");
  const committees = await listCommittees(session.user.orgId);

  const committeeList = committees.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <CommitteesPageActions committees={committeeList} />
      </div>

      {committees.length === 0 ? (
        <p className="text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="w-32">{t("members")}</TableHead>
              <TableHead className="w-32">{t("meetings")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {committees.map((committee) => (
              <TableRow key={committee.id}>
                <TableCell>
                  <Link
                    href={`/committees/${committee.id}`}
                    className="font-medium hover:underline"
                  >
                    {committee.name}
                  </Link>
                  {committee.description && (
                    <p className="text-sm text-muted-foreground">
                      {committee.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>{committee._count.members}</TableCell>
                <TableCell>{committee._count.meetings}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
