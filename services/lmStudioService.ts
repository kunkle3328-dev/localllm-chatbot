
import { APIConfig, Message, LMStudioModel } from '../types';

export const lmStudioService = {
  async fetchModels(config: APIConfig): Promise<LMStudioModel[]> {
    const isHttpsPage = window.location.protocol === 'https:';
    const isHttpTarget = config.baseUrl.startsWith('http:');

    try {
      const response = await fetch(`${config.baseUrl}/models`, {
        headers: { 
          'Authorization': `Bearer ${config.apiKey}`,
          'Accept': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Detailed fetch error:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        if (isHttpsPage && isHttpTarget) {
          throw new Error('Mixed Content Error: Browsers block HTTPS sites from accessing local HTTP APIs. You must either run this app over HTTP or use a secure tunnel (like Ngrok/Cloudflare) for LM Studio.');
        }
        throw new Error('Connection Refused: Ensure LM Studio is running, the "Local Server" is started, and "CORS" is enabled in LM Studio settings.');
      }
      throw error;
    }
  },

  async streamChat(
    config: APIConfig,
    messages: Message[],
    onToken: (token: string) => void,
    onComplete: (fullContent: string) => void,
    onError: (err: any) => void
  ) {
    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.selectedModel,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          temperature: 0.7,
        }),
        mode: 'cors'
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`API Error (${response.status}): ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported.');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices[0].delta?.content;
              if (delta) {
                fullContent += delta;
                onToken(delta);
              }
            } catch (e) {}
          }
        }
      }

      onComplete(fullContent);
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        onError(new Error('Network error: Browsers block local requests if CORS is missing or if there is a Protocol Mismatch (HTTPS -> HTTP).'));
      } else {
        onError(error);
      }
    }
  }
};
