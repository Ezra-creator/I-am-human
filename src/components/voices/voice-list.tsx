"use client";

import * as React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type VoiceProfile } from "@/lib/voice";

interface VoiceListProps {
  voices: VoiceProfile[];
  onSelectVoice: (voice: VoiceProfile) => void;
  onEditVoice: (voice: VoiceProfile) => void;
  onDeleteVoice: (voice: VoiceProfile) => void;
}

export function VoiceList({
  voices,
  onSelectVoice,
  onEditVoice,
  onDeleteVoice,
}: VoiceListProps) {
  return (
    <div
      role="list"
      aria-label="Your custom voices"
      className="w-full bg-panel border border-line rounded-[10px] divide-y divide-line overflow-hidden font-ui"
    >
      {voices.map((voice) => {
        const { metrics } = voice;
        return (
          <div
            key={voice.id}
            role="listitem"
            className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 md:py-4 hover:bg-bg/50 transition-colors gap-3 select-none"
          >
            {/* Clickable primary info area */}
            <div
              onClick={() => onSelectVoice(voice)}
              className="flex-1 cursor-pointer flex flex-col md:flex-row md:items-center gap-2 md:gap-6 min-w-0"
            >
              <div className="min-w-[180px]">
                <h3 className="font-semibold text-ink text-[15px] hover:text-accent transition-colors">
                  {voice.name}
                </h3>
                <span className="text-[12.5px] text-muted block mt-0.5">
                  {voice.samples.length} {voice.samples.length === 1 ? "sample" : "samples"} · {metrics.totalWords} words
                </span>
              </div>

              {/* Three compact metrics */}
              <div className="flex items-center gap-4 text-[13px] text-muted flex-wrap">
                <span title="Average sentence length">
                  <b className="font-medium text-ink">{metrics.meanSentenceLength}w</b> avg
                </span>
                <span className="text-line" aria-hidden="true">·</span>
                <span title="Rhythm variation">
                  Rhythm: <b className="font-medium text-ink">{metrics.rhythmCategory}</b>
                </span>
                <span className="text-line" aria-hidden="true">·</span>
                <span title="Contraction frequency">
                  Contractions: <b className="font-medium text-ink">{metrics.contractionUse}</b>
                </span>
              </div>
            </div>

            {/* Quiet Action Buttons */}
            <div className="flex items-center gap-1 shrink-0 self-end md:self-auto">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditVoice(voice);
                }}
                className="gap-1.5 h-8 px-2.5 text-muted hover:text-ink"
                aria-label={`Edit ${voice.name}`}
              >
                <Edit2 size={13} strokeWidth={1.5} />
                <span>Edit</span>
              </Button>

              <Button
                type="button"
                variant="quiet"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteVoice(voice);
                }}
                className="gap-1.5 h-8 px-2.5 text-muted hover:text-del"
                aria-label={`Delete ${voice.name}`}
              >
                <Trash2 size={13} strokeWidth={1.5} />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
