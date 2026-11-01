/**
 * Speech Helper Utility
 * Provides cross-browser Speech-to-Text (SpeechRecognition) and
 * Text-to-Speech (speechSynthesis) with dedicated Tamil (ta-IN) & English (en-IN/en-US) support.
 */

// Declare browser SpeechRecognition types for TypeScript
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const isSpeechSynthesisSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
};

export interface SpeechRecognizerOptions {
  lang: "ta-IN" | "en-IN" | "en-US";
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (errorMsg: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export class BrowserSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private options: SpeechRecognizerOptions;

  constructor(options: SpeechRecognizerOptions) {
    this.options = options;
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false; // Capture complete sentence
      this.recognition.interimResults = true; // Real-time preview while speaking
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = options.lang;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.options.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        const currentText = final.trim() || interim.trim();
        if (currentText) {
          this.options.onResult(currentText, !!final);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let msg = "Microphone error. Please try again.";
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          msg = "Microphone access blocked. Please allow microphone permission in browser settings.";
        } else if (event.error === "no-speech") {
          msg = "No speech detected. Please speak clearly into your microphone.";
        } else if (event.error === "network") {
          msg = "Network issue with speech recognition. Please check your internet connection.";
        }
        this.options.onError(msg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.options.onEnd();
      };
    }
  }

  public setLang(lang: "ta-IN" | "en-IN" | "en-US") {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start() {
    if (!this.recognition) {
      this.options.onError(
        "Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }
    if (this.isListening) {
      this.stop();
      return;
    }
    try {
      this.recognition.start();
    } catch (err: any) {
      console.warn("SpeechRecognition start error:", err);
      try {
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 200);
      } catch (e) {
        this.options.onError("Could not activate microphone. Please try again.");
      }
    }
  }

  public stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  public getListening(): boolean {
    return this.isListening;
  }
}

/**
 * Text-to-Speech Engine
 * Reads text aloud with support for Tamil (ta-IN) and English (en-IN/en-US).
 */
export const speakAloud = (
  text: string,
  lang: "ta" | "en" = "ta",
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): boolean => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    // Cancel any previous speech
    window.speechSynthesis.cancel();

    if (!text.trim()) return false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "ta" ? "ta-IN" : "en-IN";
    utterance.rate = 0.95; // Slightly slower for emergency clarity
    utterance.pitch = 1.0;

    // Pick a matching voice if present
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const targetPrefix = lang === "ta" ? "ta" : "en";
      const matched = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(targetPrefix) ||
          v.name.toLowerCase().includes(lang === "ta" ? "tamil" : "english")
      );
      if (matched) {
        utterance.voice = matched;
      }
    }

    if (callbacks?.onStart) utterance.onstart = callbacks.onStart;
    if (callbacks?.onEnd) utterance.onend = callbacks.onEnd;
    if (callbacks?.onError) utterance.onerror = callbacks.onError;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error("SpeechSynthesis error:", err);
    if (callbacks?.onError) callbacks.onError(err);
    return false;
  }
};

export const stopSpeech = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
};
