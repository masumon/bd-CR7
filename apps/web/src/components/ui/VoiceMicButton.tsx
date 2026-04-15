"use client";

import { useCallback, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

type VoiceMicButtonProps = {
  /** Called with the transcript string when voice input is captured. */
  onTranscript?: (text: string) => void;
  /** Language hint passed to the speech engine when wired. */
  language?: "en" | "bn";
  className?: string;
  disabled?: boolean;
  /** Aria label for accessibility */
  label?: string;
};

/**
 * Voice-ready mic button (UI placeholder).
 *
 * Currently shows the listening animation but does NOT process audio.
 * To activate: replace the body of `startListening()` with a real
 * Web Speech API or Whisper stream implementation — the component
 * contract (onTranscript callback) stays identical.
 */
export function VoiceMicButton({
  onTranscript,
  language = "en",
  className,
  disabled = false,
  label,
}: VoiceMicButtonProps) {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    if (disabled) return;

    setIsListening(true);

    // ── PLACEHOLDER ──────────────────────────────────────────────────────────
    // Replace this block with real Web Speech API / Whisper integration:
    //
    //   const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    //   recognition.lang = language === "bn" ? "bn-BD" : "en-US";
    //   recognition.onresult = (e) => onTranscript?.(e.results[0][0].transcript);
    //   recognition.onend = () => setIsListening(false);
    //   recognition.start();
    //
    // For now, simulate a 2-second "listening" state and dismiss.
    const timer = setTimeout(() => {
      setIsListening(false);
      // Emit an empty string so the form field clears its "listening" state
      onTranscript?.("");
    }, 2000);

    return () => clearTimeout(timer);
    // ─────────────────────────────────────────────────────────────────────────
  }, [disabled, onTranscript]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const defaultLabel = language === "bn"
    ? isListening ? "কথা বলা থামান" : "ভয়েস ইনপুট"
    : isListening ? "Stop recording" : "Voice input";

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={cn(
        "voice-btn",
        isListening && "voice-btn-active border-primary/60 bg-primary/12 text-primary",
        disabled && "opacity-40 cursor-not-allowed",
        className,
      )}
      aria-label={label ?? defaultLabel}
      title={label ?? defaultLabel}
      aria-pressed={isListening ? "true" : "false"}
    >
      {isListening
        ? <MicOff className="h-3.5 w-3.5" />
        : <Mic className="h-3.5 w-3.5" />
      }
    </button>
  );
}

// ─── Convenience wrapper: input field with trailing mic button ───────────────
type VoiceInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onTranscript?: (text: string) => void;
  language?: "en" | "bn";
  inputClassName?: string;
};

export function VoiceInput({
  onTranscript,
  language = "en",
  inputClassName,
  className,
  ...inputProps
}: VoiceInputProps) {
  const handleTranscript = useCallback((text: string) => {
    if (!text) return;
    // Fire a synthetic change event so React Hook Form picks it up
    const nativeInput = document.querySelector(`input[name="${String(inputProps.name)}"]`) as HTMLInputElement | null;
    if (nativeInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeInputValueSetter?.call(nativeInput, text);
      nativeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    onTranscript?.(text);
  }, [inputProps.name, onTranscript]);

  return (
    <div className={cn("relative flex items-center", className)}>
      <input
        {...inputProps}
        className={cn(
          "flex-1 rounded-xl border border-border/70 bg-background px-3 pr-10 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50 min-h-[40px]",
          inputClassName,
        )}
      />
      <VoiceMicButton
        onTranscript={handleTranscript}
        language={language}
        className="absolute right-2"
        disabled={inputProps.disabled}
      />
    </div>
  );
}
