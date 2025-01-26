// app/chat/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    AppBar,
    Toolbar,
    Container,
    Chip,
    CircularProgress,
    Avatar,
    useTheme, Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    Psychology as PsychologyIcon,
    AutoAwesome as AutoAwesomeIcon,
    Warning as WarningIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon,
    GraphicEq as WaveformIcon,
    PlayArrow as PlayArrowIcon,
    Stop as StopIcon,
} from '@mui/icons-material';

interface Message {
    role: 'user' | 'angel' | 'devil' | 'system';
    content: string;
    avatar?: string;
    isProcessing?: boolean;
    isVoicePlaying?: boolean;
}

interface StreamResponse {
    role: 'angel' | 'devil';
    content: string;
}


export default function DualAgentChat() {
    const theme = useTheme();
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'system',
            content: 'Welcome to the AI Council! You have two advisors ready to help. Ask away! ',
            avatar: '🤖'
        }
    ]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isListening, setIsListening] = useState(false);
    const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
    const streamFromAgent = async (
        message: string,
        role: 'angel' | 'devil'
    ): Promise<StreamResponse> => {
        const endpoint = role === 'angel'
            ? 'http://localhost:8000/api/angel/stream'
            : 'http://localhost:8000/api/devil/stream';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            let accumulatedContent = '';
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode the chunk and split by newlines to handle multiple SSE events
                const text = decoder.decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    // Only process lines that start with "data: "
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6); // Remove "data: " prefix

                        // Check if it's the done signal
                        if (data === '[DONE]') break;

                        try {
                            // Parse the JSON chunk
                            const parsed = JSON.parse(data);
                            if (parsed.chunk) {
                                accumulatedContent += parsed.chunk;

                                // Update UI with accumulated content
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const agentIndex = newMessages.findIndex(
                                        m => m.role === role && m.isProcessing
                                    );
                                    if (agentIndex !== -1) {
                                        newMessages[agentIndex] = {
                                            ...newMessages[agentIndex],
                                            content: accumulatedContent,
                                        };
                                    }
                                    return newMessages;
                                });
                            }
                        } catch (e) {
                            console.error('Error parsing chunk:', e, data);
                        }
                    }
                }
            }

            return { role, content: accumulatedContent };
        } catch (error) {
            console.error(`Error from ${role} agent:`, error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        const userMessage = input.trim();
        setInput('');
        setIsStreaming(true);

        // Add user message
        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            avatar: '👤'
        }]);

        // Add placeholder messages for both AIs
        setMessages(prev => [...prev,
            { role: 'angel', content: 'Thinking...', isProcessing: true, avatar: '👼' },
            { role: 'devil', content: 'Thinking...', isProcessing: true, avatar: '😈' }
        ]);

        try {
            // Stream both responses simultaneously
            const [angelResponse, devilResponse] = await Promise.all([
                streamFromAgent(userMessage, 'angel'),
                streamFromAgent(userMessage, 'devil')
            ]);

            // Update final messages (though they should already be updated by the streaming)
            setMessages(prev => prev.map(msg => {
                if (msg.isProcessing) {
                    if (msg.role === 'angel') {
                        return { ...msg, content: angelResponse.content, isProcessing: false };
                    } else if (msg.role === 'devil') {
                        return { ...msg, content: devilResponse.content, isProcessing: false };
                    }
                }
                return msg;
            }));

        } catch (error) {
            console.error('Error processing responses:', error);
            setMessages(prev => [...prev, {
                role: 'system',
                content: 'Sorry, an error occurred while processing responses.',
                avatar: '🤖'
            }]);
        } finally {
            setIsStreaming(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const getMessageStyles = (role: string) => {
        switch (role) {
            case 'user':
                return {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    alignSelf: 'flex-end'
                };
            case 'angel':
                return {
                    backgroundColor: theme.palette.info.light,
                    color: theme.palette.info.contrastText
                };
            case 'devil':
                return {
                    backgroundColor: theme.palette.error.light,
                    color: theme.palette.error.contrastText
                };
            default:
                return {
                    backgroundColor: theme.palette.grey[200],
                    color: theme.palette.text.primary
                };
        }
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <AppBar position="static" sx={{ bgcolor: 'white', color: 'text.primary' }}>
                <Toolbar>
                    <PsychologyIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        AI Council Chamber 🏛️
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        gap: 1,
                        '& .MuiButton-root': {
                            borderRadius: 2,
                            px: 2
                        }
                    }}>
                        <Paper
                            elevation={0}
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                px: 2,
                                py: 0.5,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <PsychologyIcon fontSize="small" />
                            <Typography>angel AI</Typography>
                        </Paper>
                        <Paper
                            elevation={0}
                            sx={{
                                bgcolor: 'error.main',
                                color: 'white',
                                px: 2,
                                py: 0.5,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <WarningIcon fontSize="small" />
                            <Typography>devil AI</Typography>
                        </Paper>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Messages Area */}
            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                bgcolor: '#f5f5f5',
                p: 2
            }}>
                <Container maxWidth="md">
                    {messages.map((message, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                                mb: 2,
                                gap: 1
                            }}
                        >
                            {/* Avatar */}
                            <Avatar
                                sx={{
                                    bgcolor: message.role === 'user'
                                        ? 'primary.main'
                                        : message.role === 'angel'
                                            ? 'info.light'
                                            : 'error.light'
                                }}
                            >
                                {message.avatar}
                            </Avatar>

                            {/* Message Bubble */}
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    maxWidth: '70%',
                                    bgcolor: message.role === 'user'
                                        ? 'primary.main'
                                        : message.role === 'angel'
                                            ? '#E3F2FD'
                                            : '#FFEBEE',
                                    color: message.role === 'user'
                                        ? 'white'
                                        : 'text.primary',
                                    borderRadius: 2,
                                    position: 'relative'
                                }}
                            >
                                <Typography>{message.content}</Typography>

                                {/* Processing Indicator */}
                                {message.isProcessing && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mt: 1,
                                        gap: 1
                                    }}>
                                        <CircularProgress size={16} />
                                        <Typography variant="caption">Processing...</Typography>
                                    </Box>
                                )}

                                {/* Voice Playback Controls */}
                                {message.role !== 'user' && !message.isProcessing && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mt: 1,
                                        gap: 1
                                    }}>
                                        <Tooltip title="Play Response">
                                            <IconButton
                                                size="small"
                                                onClick={() => {/* Voice playback function */}}
                                                sx={{
                                                    bgcolor: 'background.paper',
                                                    '&:hover': { bgcolor: 'grey.100' }
                                                }}
                                            >
                                                {message.isVoicePlaying ? (
                                                    <StopIcon fontSize="small" />
                                                ) : (
                                                    <PlayArrowIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                        {message.isVoicePlaying && (
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5
                                            }}>
                                                <WaveformIcon sx={{ fontSize: 16 }} />
                                                <Typography variant="caption">Playing...</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    ))}
                    <div ref={messagesEndRef} />
                </Container>
            </Box>

            {/* Input Form Area */}
            <Paper
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}
                elevation={3}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Voice Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={isListening ? "Stop Recording" : "Start Recording"}>
                            <IconButton
                                onClick={() => setIsListening(!isListening)}
                                disabled={isStreaming}
                                sx={{
                                    bgcolor: isListening ? 'error.main' : 'grey.200',
                                    '&:hover': {
                                        bgcolor: isListening ? 'error.dark' : 'grey.300',
                                    }
                                }}
                            >
                                {isListening ? (
                                    <MicOffIcon sx={{ color: 'white' }} />
                                ) : (
                                    <MicIcon />
                                )}
                            </IconButton>
                        </Tooltip>
                        {isListening && (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                bgcolor: 'primary.light',
                                px: 2,
                                py: 0.5,
                                borderRadius: 1,
                                gap: 1
                            }}>
                                <WaveformIcon />
                                <Typography>Recording...</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Text Input and Send Button */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Ask both AIs..."}
                            disabled={isStreaming || isListening}
                            variant="outlined"
                            size="medium"
                            sx={{ bgcolor: 'background.paper' }}
                        />
                        <IconButton
                            type="submit"
                            disabled={isStreaming || !input.trim() || isListening}
                            color="primary"
                            sx={{ p: '10px' }}
                        >
                            {isStreaming ? (
                                <CircularProgress size={24} />
                            ) : (
                                <SendIcon />
                            )}
                        </IconButton>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}