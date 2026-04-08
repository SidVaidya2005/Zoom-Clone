import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button } from '@mui/material';
import { useChat } from '@livekit/components-react';
import styles from '../../styles/videoComponent.module.css';

export default function ChatPanel({ showModal, setModal, onNewMessage }) {
    const { send, chatMessages, isSending } = useChat();
    const [message, setMessage] = useState('');
    const prevLengthRef = useRef(0);

    // Notify parent of new messages so it can increment the badge
    useEffect(() => {
        if (chatMessages.length > prevLengthRef.current) {
            onNewMessage?.();
            prevLengthRef.current = chatMessages.length;
        }
    }, [chatMessages.length, onNewMessage]);

    const sendMessage = async () => {
        if (!message.trim() || isSending) return;
        await send(message.trim());
        setMessage('');
    };

    if (!showModal) return null;

    return (
        <div className={styles.chatRoom}>
            <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                    <h1>[CHAT]</h1>
                    <button
                        className={styles.chatCloseBtn}
                        onClick={() => setModal(false)}
                        aria-label="Close chat"
                    >
                        [×]
                    </button>
                </div>

                <div className={styles.chattingDisplay}>
                    {chatMessages.length ? (
                        chatMessages.map((msg) => (
                            <div style={{ marginBottom: '20px' }} key={`${msg.from?.identity}-${msg.timestamp}`}>
                                <p style={{ fontWeight: 'bold' }}>
                                    {msg.from?.name || msg.from?.identity || 'Unknown'}
                                </p>
                                <p>{msg.message}</p>
                            </div>
                        ))
                    ) : (
                        <p>No Messages Yet</p>
                    )}
                </div>

                <div className={styles.chattingArea}>
                    <TextField
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        label="Enter Your chat"
                        variant="outlined"
                    />
                    <Button
                        variant="contained"
                        onClick={sendMessage}
                        disabled={isSending || !message.trim()}
                    >
                        [SEND]
                    </Button>
                </div>
            </div>
        </div>
    );
}
