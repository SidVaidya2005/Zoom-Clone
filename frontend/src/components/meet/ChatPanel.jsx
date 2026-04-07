import React from 'react';
import { TextField, Button } from '@mui/material';
import styles from '../../styles/videoComponent.module.css';

export default function ChatPanel({
    showModal,
    messages,
    message,
    setMessage,
    sendMessage,
    setModal,
}) {
    if (!showModal) return <></>;

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
                    {messages.length !== 0 ? messages.map((item, index) => {
                        return (
                            <div style={{ marginBottom: "20px" }} key={index}>
                                <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                <p>{item.data}</p>
                            </div>
                        );
                    }) : <p>No Messages Yet</p>}
                </div>

                <div className={styles.chattingArea}>
                    <TextField
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        id="outlined-basic"
                        label="Enter Your chat"
                        variant="outlined"
                    />
                    <Button variant='contained' onClick={sendMessage}>[SEND]</Button>
                </div>
            </div>
        </div>
    );
}
