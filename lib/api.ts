export async function getUserKeys() {
  try {
    const response = await fetch('/api/keys', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch keys');
    }

    const data = await response.json();
    return data.keys;
  } catch (error) {
    console.error('Error fetching user keys:', error);
    throw error;
  }
}

export async function updateKeyLabel(keyId: string, label: string) {
  try {
    const response = await fetch(`/api/keys/${keyId}/update-label`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ label }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update API key label');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating API key label:', error);
    throw error;
  }
}

export async function generateApiKey(hcaptchaToken?: string) {
  try {

    const response = await fetch('/api/keys/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ hcaptchaToken })
    });

    if (!response.ok) {
      throw new Error('Failed to generate API key');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating API key:', error);
    throw error;
  }
}

export async function deleteApiKey(keyId: string) {
  try {
    const response = await fetch(`/api/keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete API key');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
}

export async function disableApiKey(keyId: string) {
  try {
    const response = await fetch(`/api/keys/${keyId}/disable`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to disable API key');
    }

    return await response.json();
  } catch (error) {
    console.error('Error disabling API key:', error);
    throw error;
  }
}

export async function enableApiKey(keyId: string) {
  try {
    const response = await fetch(`/api/keys/${keyId}/enable`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to enable API key');
    }

    return await response.json();
  } catch (error) {
    console.error('Error enabling API key:', error);
    throw error;
  }
}

export async function redeemCode(code: string, hcaptchaToken?: string) {
  try {
    const response = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code, hcaptchaToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to redeem code');
    }

    return data;
  } catch (error: any) {
    console.error('Error redeeming code:', error);
    throw error;
  }
}

export async function getApiUsage() {
  try {
    const response = await fetch('/api/usage', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch usage data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching API usage:', error);
    throw error;
  }
}

export async function getApiUsageHistory(period: 'hour' | 'day' | 'week' | 'month' = 'day') {
  try {
    const response = await fetch(`/api/usage/history?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch usage history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching API usage history:', error);
    throw error;
  }
}

export async function getApiModels() {
  try {
    const response = await fetch('/api/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching API models:', error);
    throw error;
  }
}

// Playground API functions
export async function playgroundChatCompletion(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  apiKey: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
  seed?: number;
}) {
  try {
    const response = await fetch('https://api.voidai.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        top_p: params.top_p,
        frequency_penalty: params.frequency_penalty,
        presence_penalty: params.presence_penalty,
        stop: params.stop,
        stream: params.stream,
        seed: params.seed,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in chat completion:', error);
    throw error;
  }
}

export async function playgroundImageGeneration(params: {
  model: string;
  prompt: string;
  apiKey: string;
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
}) {
  try {
    const response = await fetch('https://api.voidai.app/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        size: params.size,
        quality: params.quality,
        style: params.style,
        n: params.n,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in image generation:', error);
    throw error;
  }
}

export async function playgroundTextToSpeech(params: {
  model: string;
  input: string;
  voice: string;
  apiKey: string;
  speed?: number;
  response_format?: string;
}) {
  try {
    const response = await fetch('https://api.voidai.app/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        input: params.input,
        voice: params.voice,
        speed: params.speed,
        response_format: params.response_format,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    return response; // Return response for audio data handling
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    throw error;
  }
}

export async function playgroundSpeechToText(params: {
  model: string;
  file: File;
  apiKey: string;
  language?: string;
  prompt?: string;
  response_format?: string;
  temperature?: number;
}) {
  try {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('model', params.model);
    if (params.language) formData.append('language', params.language);
    if (params.prompt) formData.append('prompt', params.prompt);
    if (params.response_format) formData.append('response_format', params.response_format);
    if (params.temperature !== undefined) formData.append('temperature', params.temperature.toString());

    const response = await fetch('https://api.voidai.app/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in speech-to-text:', error);
    throw error;
  }
}

export async function playgroundEmbeddings(params: {
  model: string;
  input: string | string[];
  apiKey: string;
  encoding_format?: string;
  dimensions?: number;
}) {
  try {
    const response = await fetch('https://api.voidai.app/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        input: params.input,
        encoding_format: params.encoding_format,
        dimensions: params.dimensions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in embeddings:', error);
    throw error;
  }
}

export async function getUserDiscounts() {
  try {
    const response = await fetch('/api/discounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch discount data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user discounts:', error);
    throw error;
  }
}