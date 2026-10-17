"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { type EditStrength } from "@/lib/rewrite-client";
import { MIN_INPUT_CHARS, MAX_INPUT_CHARS } from "@/lib/limits";
import { INITIAL_VOICE_GROUPS } from "@/data/voices";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { toast } from "@/lib/toast";

const STRENGTH_OPTIONS = [
  {
    value: "light" as EditStrength,
    label: "Light",
    tooltip:
      "Smooths stock phrasing and flat transitions. Your sentences stay mostly intact.",
  },
  {
    value: "balanced" as EditStrength,
    label: "Balanced",
    tooltip:
      "Rewrites sentences for rhythm and plain wording while keeping your structure.",
  },
  {
    value: "full" as EditStrength,
    label: "Full rewrite",
    tooltip:
      "Restructures freely in the chosen voice. Meaning and facts stay.",
  },
] as const;

export function WorkspaceToolbar() {
  const {
    original,
    strength,
    setStrength,
    voiceId,
    setVoiceId,
    status,
    runRewrite,
    stopRewrite,
  } = useWorkspaceStore();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const db = React.useMemo(() => (mounted ? getDb() : null), [mounted]);
  const customVoices = useLiveQuery(
    async () => {
      if (!db) return [];
      return await db.voices.orderBy("createdAt").toArray();
    },
    [db],
    []
  );

  // If a selected custom voice was deleted from IndexedDB, fallback to neutral and show a toast
  React.useEffect(() => {
    if (!mounted || customVoices === undefined) return;
    const isPreset = voiceId === "neutral" || voiceId === "conversational";
    if (!isPreset) {
      const exists = customVoices.some((v) => v.id === voiceId);
      if (!exists) {
        setVoiceId("neutral");
        toast({
          title: "Voice deleted",
          description: "Selected voice was deleted. Switched to Neutral professional.",
        });
      }
    }
  }, [mounted, customVoices, voiceId, setVoiceId]);

  const isMac = React.useSyncExternalStore(
    () => () => {},
    () => /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent),
    () => false
  );

  const charCount = original.length;
  const isUnderMin = charCount < MIN_INPUT_CHARS;
  const isOverMax = charCount > MAX_INPUT_CHARS;
  const isRunning = status === "running";
  const isRewriteDisabled = isUnderMin || isOverMax;

  const keyHint = isMac ? "⌘ ↵" : "Ctrl ↵";

  const rewriteButton = (
    <Button
      type="button"
      variant="primary"
      size="md"
      disabled={isRewriteDisabled}
      onClick={() => runRewrite()}
      className="max-[680px]:w-full shrink-0"
    >
      <span>Rewrite</span>
      <Kbd variant="inverse" className="ml-1.5">
        {keyHint}
      </Kbd>
    </Button>
  );

  return (
    <div
      role="toolbar"
      aria-label="Rewrite settings"
      className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-x-6 sm:gap-y-3.5 px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-line bg-panel"
    >
      {/* Voice selection */}
      <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
        <span className="text-[13px] font-medium text-muted font-ui select-none shrink-0">
          Voice
        </span>
        <Select
          value={voiceId}
          onValueChange={(val) => setVoiceId(val)}
          disabled={isRunning}
        >
          <SelectTrigger
            aria-label="Voice"
            className="w-[190px] min-[380px]:w-[220px] sm:w-[180px] md:w-[200px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {customVoices && customVoices.length > 0 && (
              <SelectGroup>
                <SelectLabel>Your voices</SelectLabel>
                {customVoices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {INITIAL_VOICE_GROUPS.map((group) => (
              <SelectGroup key={group.groupName}>
                <SelectLabel>{group.groupName}</SelectLabel>
                {group.voices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Edit strength selection */}
      <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
        <span className="text-[13px] font-medium text-muted font-ui select-none shrink-0">
          Edit strength
        </span>
        <div className="overflow-x-auto scrollbar-none max-w-full shrink-0">
          <Segmented
            id="strength"
            aria-label="Edit strength"
            options={STRENGTH_OPTIONS}
            value={strength}
            onChange={(val) => setStrength(val)}
            disabled={isRunning}
          />
        </div>
      </div>

      {/* Flexible spacer: hidden under 680px */}
      <div className="flex-1 max-[680px]:hidden" />

      {/* Primary Action Button (desktop / tablet > 680px; on <= 680px visible in sticky bottom bar) */}
      <div className="hidden min-[681px]:flex items-center shrink-0">
        {isRunning ? (
          <Button
            type="button"
            variant="quiet"
            size="md"
            onClick={() => stopRewrite()}
            className="text-del hover:text-del shrink-0"
          >
            Stop
          </Button>
        ) : isUnderMin ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{rewriteButton}</span>
            </TooltipTrigger>
            <TooltipContent>Add at least 40 characters.</TooltipContent>
          </Tooltip>
        ) : (
          rewriteButton
        )}
      </div>
    </div>
  );
}
