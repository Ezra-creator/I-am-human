"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  VoiceList,
  VoiceDialog,
  VoiceDetail,
  DeleteVoiceDialog,
} from "@/components/voices";
import {
  getDb,
  isStorageAvailable,
  deleteVoiceSafe,
  type VoiceProfile,
} from "@/lib/db";

export default function VoicesPage() {
  const [mounted, setMounted] = React.useState(false);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [voiceToEdit, setVoiceToEdit] = React.useState<VoiceProfile | null>(null);
  const [voiceToDelete, setVoiceToDelete] = React.useState<VoiceProfile | null>(null);
  const [selectedVoice, setSelectedVoice] = React.useState<VoiceProfile | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const db = React.useMemo(() => (mounted ? getDb() : null), [mounted]);
  const storageBlocked = mounted && !isStorageAvailable();

  const voices = useLiveQuery(
    async () => {
      if (!db) return [];
      return await db.voices.orderBy("createdAt").toArray();
    },
    [db],
    []
  );

  // Keep selectedVoice updated if it gets edited
  React.useEffect(() => {
    if (selectedVoice && voices) {
      const updated = voices.find((v) => v.id === selectedVoice.id);
      if (updated) {
        setSelectedVoice(updated);
      } else {
        setSelectedVoice(null);
      }
    }
  }, [voices, selectedVoice]);

  const handleDeleteConfirm = async () => {
    if (!voiceToDelete) return;
    await deleteVoiceSafe(voiceToDelete.id);
    if (selectedVoice?.id === voiceToDelete.id) {
      setSelectedVoice(null);
    }
    setVoiceToDelete(null);
  };

  return (
    <div className="py-6 md:py-10 max-w-4xl mx-auto font-ui">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-ink tracking-tight">Voices</h1>
          <p className="text-[14.5px] text-muted mt-1 leading-relaxed">
            Teach I’m human how you write so your rewrites match your authentic voice.
          </p>
        </div>

        {!storageBlocked && mounted && voices && voices.length > 0 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              setVoiceToEdit(null);
              setIsAddOpen(true);
            }}
            className="gap-2 shrink-0 self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2} />
            <span>Add voice</span>
          </Button>
        )}
      </div>

      {/* Blocked storage banner */}
      {storageBlocked && (
        <div
          role="alert"
          className="p-5 rounded-[10px] border border-line bg-panel flex items-start gap-3.5"
        >
          <AlertCircle className="w-5 h-5 text-muted shrink-0 mt-0.5" />
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Storage blocked</h2>
            <p className="text-[13.5px] text-muted mt-1 leading-relaxed">
              Saving voices needs browser storage, which is blocked right now.
              Check your browser settings or disable private browsing restrictions to save custom voices.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!storageBlocked && mounted && voices && voices.length === 0 && (
        <div className="p-10 md:p-14 text-center rounded-[10px] border border-line bg-panel">
          <p className="text-[15px] text-muted leading-relaxed max-w-md mx-auto mb-6">
            Add something you’ve written and I’m human will learn how you build sentences.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              setVoiceToEdit(null);
              setIsAddOpen(true);
            }}
            className="gap-2"
          >
            <Plus size={16} strokeWidth={2} />
            <span>Add your first voice</span>
          </Button>
        </div>
      )}

      {/* Loading state before client mount */}
      {!mounted && !storageBlocked && (
        <div className="p-12 text-center text-muted text-[14px]">
          Loading voices…
        </div>
      )}

      {/* Voice list */}
      {!storageBlocked && mounted && voices && voices.length > 0 && (
        <VoiceList
          voices={voices}
          onSelectVoice={(voice) => setSelectedVoice(voice)}
          onEditVoice={(voice) => {
            setVoiceToEdit(voice);
            setIsAddOpen(true);
          }}
          onDeleteVoice={(voice) => setVoiceToDelete(voice)}
        />
      )}

      {/* Add / Edit Dialog */}
      <VoiceDialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setVoiceToEdit(null);
        }}
        voiceToEdit={voiceToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteVoiceDialog
        open={Boolean(voiceToDelete)}
        onOpenChange={(open) => {
          if (!open) setVoiceToDelete(null);
        }}
        voice={voiceToDelete}
        onConfirm={handleDeleteConfirm}
      />

      {/* Voice Detail Sheet */}
      {selectedVoice && (
        <VoiceDetail
          voice={selectedVoice}
          onClose={() => setSelectedVoice(null)}
          onEdit={(voice) => {
            setVoiceToEdit(voice);
            setIsAddOpen(true);
          }}
          onVoiceUpdated={(updated) => setSelectedVoice(updated)}
        />
      )}
    </div>
  );
}
