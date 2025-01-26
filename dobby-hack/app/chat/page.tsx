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
    useTheme
} from '@mui/material';
import {
    Send as SendIcon,
    Psychology as PsychologyIcon,
    AutoAwesome as AutoAwesomeIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

interface Message {
    role: 'user' | 'conservative' | 'unhinged' | 'system';
    content: string;
    avatar?: string;
    isProcessing?: boolean;
}

interface StreamResponse {
    role: 'conservative' | 'unhinged';
    content: string;
}

export default function DualAgentChat() {
    const theme = useTheme();
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'system',
            content: 'Welcome to the AI Council! You have two advisors ready to help. Ask away! 🎯',
            avatar: '🤖'
        }
    ]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const streamFromAgent = async (
        message: string,
        role: 'conservative' | 'unhinged'
    ): Promise<StreamResponse> => {
        const endpoint = role === 'conservative'
            ? 'http://localhost:5000/conservative'
            : 'http://localhost:5000/unhinged';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!response.ok) throw new Error(`Error from ${role} agent`);

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            let accumulatedContent = '';
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                accumulatedContent += chunk;

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

        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            avatar: '👤'
        }]);

        setMessages(prev => [...prev,
            { role: 'conservative', content: '...', isProcessing: true, avatar: '👼' },
            { role: 'unhinged', content: '...', isProcessing: true, avatar: '😈' }
        ]);

        try {
            const [conservativeResponse, unhingedResponse] = await Promise.all([
                streamFromAgent(userMessage, 'conservative'),
                streamFromAgent(userMessage, 'unhinged')
            ]);

            setMessages(prev => prev.map(msg => {
                if (msg.isProcessing) {
                    if (msg.role === 'conservative') {
                        return { ...msg, content: conservativeResponse.content, isProcessing: false };
                    } else if (msg.role === 'unhinged') {
                        return { ...msg, content: unhingedResponse.content, isProcessing: false };
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
            case 'conservative':
                return {
                    backgroundColor: theme.palette.info.light,
                    color: theme.palette.info.contrastText
                };
            case 'unhinged':
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
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <PsychologyIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        AI Council Chamber 🏛️
                    </Typography>
                    <Chip
                        icon={<AutoAwesomeIcon />}
                        label="Conservative AI"
                        color="primary"
                        sx={{ mr: 1 }}
                    />
                    <Chip
                        icon={<WarningIcon />}
                        label="Unhinged AI"
                        color="error"
                    />
                </Toolbar>
            </AppBar>

            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                bgcolor: 'grey.50',
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
                            <Avatar sx={{ bgcolor: message.role === 'user' ? 'primary.main' : 'grey.300' }}>
                                {message.avatar}
                            </Avatar>
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    maxWidth: '70%',
                                    ...getMessageStyles(message.role)
                                }}
                            >
                                <ReactMarkdown className="prose prose-sm">
                                    {message.content}
                                </ReactMarkdown>
                                {message.isProcessing && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                        <Typography variant="caption">Processing...</Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    ))}
                    <div ref={messagesEndRef} />
                </Container>
            </Box>

            <Paper
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider'
                }}
                elevation={3}
            >
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask both AIs..."
                        disabled={isStreaming}
                        variant="outlined"
                        size="medium"
                    />
                    <IconButton
                        type="submit"
                        disabled={isStreaming || !input.trim()}
                        color="primary"
                        sx={{ p: '10px' }}
                    >
                        {isStreaming ? <CircularProgress size={24} /> : <SendIcon />}
                    </IconButton>
                </Box>
            </Paper>
        </Box>
    );
}