
// Conceptual Native Module Wrapper
const Voice = (window as any).Voice || {
  start: (locale: string) => console.log("Native Voice start:", locale),
  stop: () => console.log("Native Voice stop"),
  onSpeechResults: (results: any) => console.log("Native Speech Result:", results)
};

export function startListening(onText: (t: string) => void) {
  Voice.onSpeechResults = (e: any) => {
    if (e.value && e.value.length > 0) {
      onText(e.value[0]);
    }
  };
  Voice.start("en-US");
}

export function stopListening() {
  Voice.stop();
}
