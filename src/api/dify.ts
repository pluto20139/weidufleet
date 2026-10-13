export interface DifyChunk {
  event: string;
  answer?: string;
  conversationId?: string;
  error?: string;
}

/**
 * Stream chat with Dify Chatbot REST API using fetch + ReadableStream.
 * Handles SSE parsing and custom authorization/abort signals.
 */
export async function* streamChat(
  query: string,
  conversationId?: string | null,
  signal?: AbortSignal
): AsyncGenerator<DifyChunk> {
  const baseUrl = import.meta.env.VITE_DIFY_BASE_URL || '';
  const token = import.meta.env.VITE_DIFY_TOKEN || '';

  if (!token) {
    yield { event: 'error', error: 'Dify token is not configured.' };
    return;
  }

  // Normalize API endpoint url
  let apiEndpoint = baseUrl;
  if (!apiEndpoint.endsWith('/v1')) {
    apiEndpoint = apiEndpoint.endsWith('/') ? `${apiEndpoint}v1` : `${apiEndpoint}/v1`;
  }
  const url = `${apiEndpoint}/chat-messages`;

  // Fetch or generate anon user id
  let anonUser = localStorage.getItem('dify_anon_user');
  if (!anonUser) {
    anonUser = 'anon-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('dify_anon_user', anonUser);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        inputs: {},
        response_mode: 'streaming',
        conversation_id: conversationId || '',
        user: anonUser,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported by the browser response body');
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines are separated by newlines. A single SSE block could span multiple lines.
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);
          yield {
            event: data.event,
            answer: data.answer || '',
            conversationId: data.conversation_id || '',
          };
        } catch (e) {
          console.error('Failed to parse SSE JSON chunk:', jsonStr, e);
        }
      }
    }

    // Process any remaining content in the buffer
    if (buffer.trim().startsWith('data:')) {
      const trimmed = buffer.trim();
      const jsonStr = trimmed.slice(5).trim();
      try {
        const data = JSON.parse(jsonStr);
        yield {
          event: data.event,
          answer: data.answer || '',
          conversationId: data.conversation_id || '',
        };
      } catch (e) {}
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      yield { event: 'abort' };
    } else {
      console.error('Error during Dify streamChat API call:', error);
      yield { event: 'error', error: error.message || 'Network request failed' };
    }
  }
}
