// services/voiceManager.ts
'use client';

import { ElevenLabsVoiceGenerator } from './elevenLabsService';

interface VoiceConfig {
    voiceId: string;
    name: string;
    stability: number;
    similarityBoost: number;
    modelId: string;
}

interface AgentVoice {
    role: 'conservative' | 'unhinged';
    config: VoiceConfig;
}

export class VoiceManager {
    private voiceGenerator: ElevenLabsVoiceGenerator;
    private audioContext: AudioContext | null = null;
    private activeStreams: Map<string, MediaStreamAudioSourceNode> = new Map();

    private readonly agentVoices: AgentVoice[] = [
        {
            role: 'conservative',
            config: {
                voiceId: 'your-conservative-voice-id',
                name: 'Prudence',
                stability: 0.7,
                similarityBoost: 0.8,
                modelId: 'eleven_monolingual_v1'
            }
        },
        {
            role: 'unhinged',
            config: {
                voiceId: 'your-unhinged-voice-id',
                name: 'Chaos',
                stability: 0.3,
                similarityBoost: 0.9,
                modelId: 'eleven_monolingual_v1'
            }
        }
    ];

    constructor(apiKey: string) {
        this.voiceGenerator = new ElevenLabsVoiceGenerator(apiKey);
    }

    private initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }

    async generateVoiceStream(text: string, role: 'conservative' | 'unhinged'): Promise<ReadableStream<Uint8Array>> {
        const agent = this.agentVoices.find(a => a.role === role);
        if (!agent) throw new Error('Invalid agent role');

        return this.voiceGenerator.generateStream(text, agent.config);
    }

    async playVoiceStream(stream: ReadableStream<Uint8Array>, role: string) {
        const audioContext = this.initAudioContext();

        // Stop any existing stream for this role
        if (this.activeStreams.has(role)) {
            this.activeStreams.get(role)?.disconnect();
            this.activeStreams.delete(role);
        }

        try {
            // Convert stream to audio buffer
            const response = new Response(stream);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Create and play source
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            // Store the stream
            const streamNode = audioContext.createMediaStreamSource(
                new MediaStream([audioBuffer])
            );
            this.activeStreams.set(role, streamNode);

            // Play the audio
            source.start(0);

            return new Promise((resolve) => {
                source.onended = () => {
                    this.activeStreams.delete(role);
                    resolve(undefined);
                };
            });
        } catch (error) {
            console.error('Error playing voice stream:', error);
            throw error;
        }
    }

    stopAllStreams() {
        this.activeStreams.forEach((stream) => {
            stream.disconnect();
        });
        this.activeStreams.clear();
    }
}