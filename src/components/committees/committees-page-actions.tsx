"use client";

import { useState } from "react";
import { CommitteeActionsMenu } from "./committee-actions-menu";
import { CreateCommitteeDialog } from "./create-committee-dialog";
import { CreateMeetingDialog } from "@/components/meetings/create-meeting-dialog";

interface Committee {
  id: string;
  name: string;
}

export function CommitteesPageActions({ committees }: { committees: Committee[] }) {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  return (
    <>
      <CommitteeActionsMenu onAction={(action) => setOpenDialog(action)} />

      <CreateCommitteeDialog
        open={openDialog === "committee"}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      />

      {(openDialog === "meeting") && (
        <CreateMeetingDialog
          committees={committees}
          open={true}
          onOpenChange={(open) => !open && setOpenDialog(null)}
        />
      )}

      {(openDialog === "standalone") && (
        <CreateMeetingDialog
          committees={committees}
          open={true}
          onOpenChange={(open) => !open && setOpenDialog(null)}
          defaultStandalone={true}
        />
      )}
    </>
  );
}
