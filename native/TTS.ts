
// Conceptual Native Module Wrapper
const Tts = (window as any).Tts || {
  speak: (text: string) => console.log("Native TTS:", text),
  setDefaultRate: (rate: number) => {},
  setDefaultPitch: (pitch: number) => {}
};

export function speak(text: string) {
  Tts.setDefaultRate(0.5);
  Tts.setDefaultPitch(1.0);
  Tts.speak(text);
}
