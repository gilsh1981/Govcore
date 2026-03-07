"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { mockOrganizations } from "@/lib/mock-data";

interface OrgSwitcherProps {
  currentOrgId: string;
}

export function OrgSwitcher({ currentOrgId }: OrgSwitcherProps) {
  const t = useTranslations("orgSwitcher");
  const [selectedOrgId, setSelectedOrgId] = useState(currentOrgId);

  const currentOrg =
    mockOrganizations.find((o) => o.id === selectedOrgId) ||
    mockOrganizations[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{currentOrg.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{t("switchOrganization")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockOrganizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setSelectedOrgId(org.id)}
            className="flex items-center justify-between"
          >
            <span>{org.name}</span>
            {org.id === selectedOrgId && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
