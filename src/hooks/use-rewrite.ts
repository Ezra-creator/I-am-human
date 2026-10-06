import { useWorkspaceStore } from "@/lib/workspace-store";

export function useRewrite() {
  const {
    original,
    strength,
    voiceId,
    status,
    result,
    error,
    view,
    setOriginal,
    setStrength,
    setVoiceId,
    setView,
    runRewrite,
    stopRewrite,
    clearOriginal,
  } = useWorkspaceStore();

  return {
    original,
    strength,
    voiceId,
    status,
    result,
    error,
    view,
    isRunning: status === "running",
    isDone: status === "done",
    isError: status === "error",
    setOriginal,
    setStrength,
    setVoiceId,
    setView,
    runRewrite,
    stopRewrite,
    clearOriginal,
  };
}
