"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { countWords } from "@/lib/limits";
import { extractMetrics, generateDescriptor, type VoiceProfile, type Sample } from "@/lib/voice";
import { saveVoiceSafe } from "@/lib/db";
import { cn } from "@/lib/utils";

interface VoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voiceToEdit?: VoiceProfile | null;
  onSaved?: (voice: VoiceProfile) => void;
}

interface SampleDraft {
  id: string;
  text: string;
}

export function VoiceDialog({
  open,
  onOpenChange,
  voiceToEdit,
  onSaved,
}: VoiceDialogProps) {
  const [name, setName] = React.useState("");
  const [samples, setSamples] = React.useState<SampleDraft[]>([
    { id: "sample-1", text: "" },
  ]);
  const [duplicateError, setDuplicateError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Populate when editing existing voice or reset when opening new
  React.useEffect(() => {
    if (open) {
      if (voiceToEdit) {
        setName(voiceToEdit.name);
        setSamples(
          voiceToEdit.samples.length > 0
            ? voiceToEdit.samples.map((s) => ({ id: s.id, text: s.text }))
            : [{ id: "sample-1", text: "" }]
        );
      } else {
        setName("");
        setSamples([{ id: "sample-1", text: "" }]);
      }
      setDuplicateError(null);
    }
  }, [open, voiceToEdit]);

  // Compute total word and char counts across samples
  const totalWords = samples.reduce((acc, s) => acc + countWords(s.text), 0);
  const totalChars = samples.reduce((acc, s) => acc + s.text.length, 0);

  const meetsMinimum = totalWords >= 150;
  const isOverCharCap = totalChars > 50000;
  const isOverSampleCap = samples.length > 20;
  const isValidName = name.trim().length > 0 && name.trim().length <= 40;

  const handleTextChange = (id: string, newText: string) => {
    setSamples((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text: newText } : s))
    );
    setDuplicateError(null);
  };

  const handleAddSample = () => {
    if (samples.length >= 20 || isOverCharCap) return;
    setSamples((prev) => [
      ...prev,
      { id: `sample-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: "" },
    ]);
  };

  const handleRemoveSample = (id: string) => {
    if (samples.length <= 1) return;
    setSamples((prev) => prev.filter((s) => s.id !== id));
    setDuplicateError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidName || !meetsMinimum || isOverCharCap || isOverSampleCap) return;

    // Check for duplicates
    const cleanedSampleTexts = samples
      .map((s) => s.text.trim())
      .filter((t) => t.length > 0);

    const seen = new Set<string>();
    for (const text of cleanedSampleTexts) {
      const normalized = text.toLowerCase();
      if (seen.has(normalized)) {
        setDuplicateError("One or more samples are identical duplicates. Please provide unique samples.");
        return;
      }
      seen.add(normalized);
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const metrics = extractMetrics(cleanedSampleTexts);
      const descriptor = generateDescriptor(metrics);

      const finalSamples: Sample[] = cleanedSampleTexts.map((text, idx) => ({
        id: samples[idx]?.id || `sample-${now}-${idx}`,
        text,
        addedAt: now,
      }));

      const voiceProfile: VoiceProfile = {
        id: voiceToEdit?.id || `voice-${now}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        createdAt: voiceToEdit?.createdAt || now,
        updatedAt: now,
        samples: finalSamples,
        metrics,
        descriptor,
      };

      await saveVoiceSafe(voiceProfile);
      onSaved?.(voiceProfile);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save voice profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{voiceToEdit ? "Edit voice" : "Add voice"}</DialogTitle>
            <DialogDescription>
              Add examples of your writing. I’m human analyzes sentence rhythm, phrasing habits, and word choices to build a style guide for your rewrites.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 font-ui">
            {/* Name Input */}
            <div>
              <label
                htmlFor="voice-name"
                className="block text-[13px] font-semibold text-ink mb-1.5"
              >
                Voice name
              </label>
              <input
                id="voice-name"
                type="text"
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My essays, Newsletter voice, Technical blog"
                className={cn(
                  "w-full bg-panel border border-line rounded-[6px] px-3 py-2 text-[14px] text-ink",
                  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 placeholder:text-muted/60"
                )}
              />
              <span className="text-[11px] text-muted block mt-1">
                {name.length}/40 characters
              </span>
            </div>

            {/* Samples inputs */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">
                  Writing samples
                </span>
                <span
                  className={cn(
                    "text-[12px] font-medium",
                    meetsMinimum ? "text-accent" : "text-muted"
                  )}
                >
                  {totalWords} / 150 words minimum
                </span>
              </div>

              {samples.map((sample, index) => {
                const sampleWords = countWords(sample.text);
                return (
                  <div
                    key={sample.id}
                    className="border border-line rounded-[8px] p-3 bg-panel/40 relative group"
                  >
                    <div className="flex items-center justify-between text-[12px] text-muted mb-2 select-none">
                      <span className="font-medium text-ink">Sample {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span>{sampleWords} {sampleWords === 1 ? "word" : "words"}</span>
                        {samples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSample(sample.id)}
                            className="text-muted hover:text-del p-0.5 rounded cursor-pointer transition-colors"
                            aria-label={`Remove sample ${index + 1}`}
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      value={sample.text}
                      onChange={(e) => handleTextChange(sample.id, e.target.value)}
                      placeholder="Paste an excerpt of your writing here..."
                      rows={5}
                      className={cn(
                        "w-full bg-transparent border-0 outline-none resize-y p-0",
                        "font-text text-[15px] leading-[1.65] text-ink placeholder:text-muted/60",
                        "focus-visible:outline-none"
                      )}
                    />
                  </div>
                );
              })}

              {duplicateError && (
                <p className="text-[12.5px] text-del font-medium mt-1">
                  {duplicateError}
                </p>
              )}

              {/* Action row to append sample */}
              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSample}
                  disabled={samples.length >= 20 || isOverCharCap}
                  className="gap-1.5"
                >
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Add another sample</span>
                </Button>

                {totalWords > 0 && totalWords < 400 && meetsMinimum && (
                  <span className="text-[12px] text-muted">
                    More writing gives a more accurate voice.
                  </span>
                )}
              </div>
            </div>

            {/* Privacy notice banner */}
            <p className="text-[12px] text-muted leading-relaxed pt-2 border-t border-line/60">
              Samples are analyzed in this browser and only a short style summary is sent when rewriting, never the samples themselves.
            </p>
          </div>

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
              type="submit"
              variant="primary"
              size="md"
              disabled={!isValidName || !meetsMinimum || isOverCharCap || isSaving}
              isLoading={isSaving}
            >
              {voiceToEdit ? "Save changes" : "Create voice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
