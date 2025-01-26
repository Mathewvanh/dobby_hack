// services/elevenLabsService.ts
'use client';

interface VoiceConfig {
    voiceId: string;
    stability: number;
    similarityBoost: number;
    modelId: string;
}

export class ElevenLabsVoiceGenerator {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.elevenlabs.io/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateStream(
        text: string,
        config: VoiceConfig
    ): Promise<ReadableStream<Uint8Array>> {
        const response = await fetch(
            `${this.baseUrl}/text-to-speech/${config.voiceId}/stream`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey,
                },
                body: JSON.stringify({
                    text,
                    model_id: config.modelId,
                    voice_settings: {
                        stability: config.stability,
                        similarity_boost: config.similarityBoost,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Eleven Labs API error: ${response.statusText}`);
        }

        return response.body!;
    }

    async getVoiceList(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/voices`, {
            headers: {
                'xi-api-key': this.apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch voices: ${response.statusText}`);
        }

        return response.json();
    }
}