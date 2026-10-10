"use client";

import * as React from "react";
import { X, Copy, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type VoiceProfile,
  extractMetrics,
  generateDescriptor,
} from "@/lib/voice";
import { countWords } from "@/lib/limits";
import { saveVoiceSafe } from "@/lib/db";
import { cn } from "@/lib/utils";

interface VoiceDetailProps {
  voice: VoiceProfile;
  onClose: () => void;
  onEdit: (voice: VoiceProfile) => void;
  onVoiceUpdated: (voice: VoiceProfile) => void;
}

export function VoiceDetail({
  voice,
  onClose,
  onEdit,
  onVoiceUpdated,
}: VoiceDetailProps) {
  const [copied, setCopied] = React.useState(false);
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyDescriptor = async () => {
    try {
      await navigator.clipboard.writeText(voice.descriptor);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error("Failed to copy descriptor:", err);
    }
  };

  const handleRemoveSample = async (sampleId: string) => {
    if (voice.samples.length <= 1) {
      alert("A voice profile must contain at least one sample.");
      return;
    }

    const remainingSamples = voice.samples.filter((s) => s.id !== sampleId);
    const totalWordsRemaining = remainingSamples.reduce(
      (acc, s) => acc + countWords(s.text),
      0
    );

    if (totalWordsRemaining < 150) {
      alert(
        "Removing this sample would bring your voice below the 150-word minimum. Please add replacement writing first."
      );
      return;
    }

    const newMetrics = extractMetrics(remainingSamples.map((s) => s.text));
    const newDescriptor = generateDescriptor(newMetrics);

    const updatedVoice: VoiceProfile = {
      ...voice,
      updatedAt: Date.now(),
      samples: remainingSamples,
      metrics: newMetrics,
      descriptor: newDescriptor,
    };

    await saveVoiceSafe(updatedVoice);
    onVoiceUpdated(updatedVoice);
  };

  const { metrics } = voice;
  const maxHistogramCount = Math.max(
    1,
    ...Object.values(metrics.histogram)
  );

  return (
    <div
      role="region"
      aria-label={`Voice details for ${voice.name}`}
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-panel border-l border-line shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex flex-col font-ui overflow-hidden animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-line shrink-0">
        <div>
          <h2 className="text-[17px] font-bold text-ink">{voice.name}</h2>
          <p className="text-[12.5px] text-muted mt-0.5">
            {voice.samples.length} {voice.samples.length === 1 ? "sample" : "samples"} · {metrics.totalWords} words
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(voice)}
            className="gap-1.5"
          >
            <Edit2 size={13} strokeWidth={1.5} />
            <span>Edit</span>
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink rounded-[4px] cursor-pointer"
            aria-label="Close voice details"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-[13px]">
        {/* Sentence length histogram */}
        <section aria-labelledby="hist-title">
          <h3 id="hist-title" className="text-[13px] font-semibold text-muted mb-2.5">
            Sentence length distribution
          </h3>
          <div className="border border-line rounded-[6px] p-3.5 bg-panel">
            <div className="flex items-end justify-between gap-2 h-24 pb-2 border-b border-line">
              {(
                [
                  ["1-5", metrics.histogram["1-5"]],
                  ["6-10", metrics.histogram["6-10"]],
                  ["11-15", metrics.histogram["11-15"]],
                  ["16-20", metrics.histogram["16-20"]],
                  ["21-30", metrics.histogram["21-30"]],
                  ["31+", metrics.histogram["31+"]],
                ] as const
              ).map(([bucket, count]) => {
                const heightPct = Math.round((count / maxHistogramCount) * 100);
                return (
                  <div
                    key={bucket}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1 group"
                  >
                    <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </span>
                    <div
                      role="img"
                      aria-label={`${bucket} words: ${count} sentences`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      className={cn(
                        "w-full rounded-t-[2px] transition-all",
                        count > 0 ? "bg-accent" : "bg-line"
                      )}
                    />
                    <span className="text-[11px] text-muted mt-1 select-none">
                      {bucket}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[11.5px] text-muted mt-2 pt-1">
              <span>Avg: <b>{metrics.meanSentenceLength}w</b></span>
              <span>Median: <b>{metrics.medianSentenceLength}w</b></span>
              <span>Variation: <b>{metrics.rhythmCategory}</b></span>
            </div>
          </div>
        </section>

        {/* Punctuation habits */}
        <section aria-labelledby="punct-title">
          <h3 id="punct-title" className="text-[13px] font-semibold text-muted mb-2.5">
            Punctuation per 100 sentences
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="p-2.5 border border-line rounded-[6px] flex justify-between items-center">
              <span className="text-muted">Commas</span>
              <span className="font-semibold text-ink">{metrics.punctuation.commas}</span>
            </div>
            <div className="p-2.5 border border-line rounded-[6px] flex justify-between items-center">
              <span className="text-muted">Em dashes</span>
              <span className="font-semibold text-ink">{metrics.punctuation.emDashes}</span>
            </div>
            <div className="p-2.5 border border-line rounded-[6px] flex justify-between items-center">
              <span className="text-muted">Semicolons</span>
              <span className="font-semibold text-ink">{metrics.punctuation.semicolons}</span>
            </div>
            <div className="p-2.5 border border-line rounded-[6px] flex justify-between items-center">
              <span className="text-muted">Questions</span>
              <span className="font-semibold text-ink">{metrics.punctuation.questionMarks}</span>
            </div>
          </div>
        </section>

        {/* Openers & Connectors */}
        {(metrics.topOpeners.length > 0 || metrics.topConnectors.length > 0) && (
          <section aria-labelledby="lex-title">
            <h3 id="lex-title" className="text-[13px] font-semibold text-muted mb-2.5">
              Habits & transitions
            </h3>
            <div className="border border-line rounded-[6px] p-3 space-y-2.5 text-[12.5px]">
              {metrics.topOpeners.length > 0 && (
                <div>
                  <span className="text-muted block text-[11px] mb-1">Frequent sentence openers:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.topOpeners.map((o) => (
                      <span
                        key={o.word}
                        className="px-2 py-0.5 rounded-[4px] bg-panel border border-line text-ink font-medium"
                      >
                        {o.word} <span className="text-muted text-[10px]">({o.count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {metrics.topConnectors.length > 0 && (
                <div className="pt-2 border-t border-line">
                  <span className="text-muted block text-[11px] mb-1">Recurring connectors:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.topConnectors.map((c) => (
                      <span
                        key={c.word}
                        className="px-2 py-0.5 rounded-[4px] bg-accent-soft text-accent font-medium text-[11.5px]"
                      >
                        {c.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Generated Style Descriptor */}
        <section aria-labelledby="desc-title">
          <div className="flex items-center justify-between mb-2">
            <h3 id="desc-title" className="text-[13px] font-semibold text-muted">
              Generated style guide
            </h3>
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={handleCopyDescriptor}
              className="gap-1 h-6 px-2 text-[11px]"
            >
              <Copy size={12} strokeWidth={1.5} />
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          <div className="p-3 rounded-[6px] border border-line bg-panel text-[12.5px] leading-relaxed text-ink whitespace-pre-wrap max-h-[180px] overflow-y-auto">
            {voice.descriptor}
          </div>
          <span className="text-[11px] text-muted block mt-1">
            {voice.descriptor.length}/1500 characters
          </span>
        </section>

        {/* Samples List */}
        <section aria-labelledby="samples-title">
          <h3 id="samples-title" className="text-[13px] font-semibold text-muted mb-2.5">
            Samples ({voice.samples.length})
          </h3>
          <div className="space-y-2">
            {voice.samples.map((sample, idx) => {
              const words = countWords(sample.text);
              return (
                <div
                  key={sample.id}
                  className="p-3 border border-line rounded-[6px] bg-panel flex items-start justify-between gap-3 text-[12px]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-ink">Sample {idx + 1}</span>
                      <span className="text-muted">· {words} words</span>
                    </div>
                    <p className="font-text text-[13px] text-muted line-clamp-2 leading-relaxed">
                      {sample.text}
                    </p>
                  </div>
                  {voice.samples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSample(sample.id)}
                      className="text-muted hover:text-del p-1 rounded cursor-pointer transition-colors"
                      aria-label={`Delete sample ${idx + 1}`}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
