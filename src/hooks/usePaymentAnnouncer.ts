import { useEffect, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type L = "hi" | "en" | "ta" | "te" | "kn";
const CODE: Record<L, string> = { hi: "hi-IN", en: "en-IN", ta: "ta-IN", te: "te-IN", kn: "kn-IN" };
const LINE: Record<L, (a: string) => string> = {
  hi: (a) => `${a} रुपये का पेमेंट मिल गया`,
  en: (a) => `Payment of ${a} rupees received`,
  ta: (a) => `${a} ரூபாய் பணம் பெறப்பட்டது`,
  te: (a) => `${a} రూపాయల చెల్లింపు అందింది`,
  kn: (a) => `${a} ರೂಪಾಯಿ ಪಾವತಿ ಬಂದಿದೆ`,
};

export function usePaymentAnnouncer(lang: L = "hi") {
  const latest = useQuery(api.razorpay.latestPaymentEvent);
  const tts = useAction(api.voice.sarvamTts);
  const seen = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (latest === undefined) return;                    // loading
    if (seen.current === undefined) {                    // first load: stay quiet
      seen.current = latest?.id ?? null;
      return;
    }
    if (!latest || latest.id === seen.current) return;
    seen.current = latest.id;
    const text = LINE[lang](String(latest.amount));
    (async () => {
      try {
        const r = await tts({ text, language: CODE[lang] });
        if (r.available && r.audioBase64) {
          await new Audio("data:audio/wav;base64," + r.audioBase64).play();
          return;
        }
      } catch { /* fall through to browser voice */ }
      speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    })();
  }, [latest, lang, tts]);
}