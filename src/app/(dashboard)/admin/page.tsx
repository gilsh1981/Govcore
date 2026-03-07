import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SyncTrigger } from "@/components/admin/sync-trigger";
import { Database, RefreshCw, Users, CheckCircle, XCircle, Clock } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const orgId = session.user.orgId;

  const [users, syncLogs] = await Promise.all([
    db.user.findMany({
      where: { orgId, deletedAt: null },
      select: {
        id: true, name: true, email: true, role: true, status: true,
        provider: true, externalId: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.syncLog.findMany({
      where: { orgId },
      orderBy: { startedAt: "desc" },
      take: 10,
    }).catch(() => [] as { id: string; startedAt: Date; status: string; provider: string; usersCreated?: number; usersUpdated?: number; usersDisabled?: number }[]),
  ]);

  const lastSync = syncLogs[0] ?? null;
  const importedUsers = users.filter((u) => u.provider !== "LOCAL" || u.externalId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Database className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Panel</h1>
          <p className="text-sm text-slate-500">Active Directory sync and user management</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sync control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              Directory Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastSync ? (
              <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Last sync</p>
                  {lastSync.status === "SUCCESS" ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 me-1" />
                      Success
                    </Badge>
                  ) : lastSync.status === "FAILED" ? (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 me-1" />
                      Failed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 me-1" />
                      {lastSync.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(lastSync.startedAt).toLocaleString()}
                </p>
                {lastSync.usersCreated !== undefined && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
                    <div className="rounded bg-green-50 p-2">
                      <p className="font-semibold text-green-700">{lastSync.usersCreated}</p>
                      <p className="text-green-600">Created</p>
                    </div>
                    <div className="rounded bg-blue-50 p-2">
                      <p className="font-semibold text-blue-700">{lastSync.usersUpdated}</p>
                      <p className="text-blue-600">Updated</p>
                    </div>
                    <div className="rounded bg-slate-50 p-2">
                      <p className="font-semibold text-slate-700">{lastSync.usersDisabled}</p>
                      <p className="text-slate-600">Deactivated</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sync runs yet.</p>
            )}

            <SyncTrigger />
          </CardContent>
        </Card>

        {/* Sync history */}
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
          </CardHeader>
          <CardContent>
            {syncLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sync history available.</p>
            ) : (
              <div className="divide-y">
                {syncLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        {new Date(log.startedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.provider}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.usersCreated !== undefined && (
                        <span className="text-xs text-slate-500">+{log.usersCreated}</span>
                      )}
                      <Badge
                        variant={log.status === "SUCCESS" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All users */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              Users
              <Badge variant="secondary">{users.length}</Badge>
              {importedUsers.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {importedUsers.length} from directory
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{user.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {user.externalId && (
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                        AD
                      </Badge>
                    )}
                    <Badge variant={user.role === "ADMIN" ? "default" : "outline"} className="text-xs">
                      {user.role}
                    </Badge>
                    <Badge
                      variant={user.status === "ACTIVE" ? "secondary" : "outline"}
                      className={`text-xs ${user.status !== "ACTIVE" ? "text-slate-400" : ""}`}
                    >
                      {user.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground w-24 text-end">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
