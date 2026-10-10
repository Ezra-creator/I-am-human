"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type VoiceProfile } from "@/lib/voice";

interface DeleteVoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voice: VoiceProfile | null;
  onConfirm: () => void;
}

export function DeleteVoiceDialog({
  open,
  onOpenChange,
  voice,
  onConfirm,
}: DeleteVoiceDialogProps) {
  if (!voice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete voice</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{voice.name}&rdquo;? This will remove this voice from this browser. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="bg-del hover:brightness-110 text-white"
          >
            Delete voice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
