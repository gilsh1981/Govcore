"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

export function SyncTrigger() {
  const router = useRouter();
  const [provider, setProvider] = useState<"AZURE_AD" | "LDAP">("AZURE_AD");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function triggerSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        setResult("Sync job queued successfully.");
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setResult(`Error: ${err.error || "Unknown error"}`);
      }
    } catch {
      setResult("Network error. Check your connection.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={provider} onValueChange={(v) => setProvider(v as typeof provider)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AZURE_AD">Azure AD</SelectItem>
            <SelectItem value="LDAP">LDAP</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={triggerSync} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Syncing…" : "Trigger Sync"}
        </Button>
      </div>
      {result && (
        <p className={`text-sm ${result.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
          {result}
        </p>
      )}
    </div>
  );
}
