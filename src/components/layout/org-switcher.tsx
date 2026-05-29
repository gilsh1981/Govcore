"use client";

import { useTranslations } from "next-intl";
import { Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface OrgSwitcherProps {
  orgName: string;
}

export function OrgSwitcher({ orgName }: OrgSwitcherProps) {
  const t = useTranslations("orgSwitcher");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{orgName}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{t("switchOrganization")}</DropdownMenuLabel>
        <DropdownMenuItem className="flex items-center justify-between">
          <span>{orgName}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
