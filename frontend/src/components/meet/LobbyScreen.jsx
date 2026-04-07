import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button } from '@mui/material';
import styles from '../../styles/videoComponent.module.css';
import '../../App.css';
import useASCIICanvas from '../../hooks/useASCIICanvas';

export default function LobbyScreen({ connecting, error, onJoin, navigate }) {
    const lobbyCanvasRef = useASCIICanvas();
    const localVideoRef = useRef(null);
    const streamRef = useRef(null);

    const [username, setUsername] = useState('');
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [videoAvailable, setVideoAvailable] = useState(false);
    const [audioAvailable, setAudioAvailable] = useState(false);
    const [videoPending, setVideoPending] = useState(true);
    const [audioPending, setAudioPending] = useState(true);

    // Acquire preview stream once on mount
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                streamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                setVideoAvailable(true);
                setAudioAvailable(true);
            })
            .catch(() => {
                // Permissions denied or no devices — proceed without preview
            })
            .finally(() => {
                setVideoPending(false);
                setAudioPending(false);
            });

        return () => streamRef.current?.getTracks().forEach((t) => t.stop());
    }, []);

    // Toggle video track enabled state on the preview stream
    useEffect(() => {
        streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = video; });
    }, [video]);

    // Toggle audio track enabled state on the preview stream
    useEffect(() => {
        streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = audio; });
    }, [audio]);

    const handleJoin = () => {
        if (!username.trim() || connecting) return;
        // Stop preview so LiveKit can acquire the same devices
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        onJoin(username.trim(), { video: video && videoAvailable, audio: audio && audioAvailable });
    };

    return (
        <div className={styles.lobbyContainer}>
            <canvas ref={lobbyCanvasRef} className={styles.lobbyCanvas} />
            <div className={styles.lobbyOverlay} />
            <div className={styles.lobbyContent}>
                <header className="landingTopBar">
                    <nav className="authTopLeft">
                        <span className="navLinkBracket" onClick={() => navigate('/')}>[HOME]</span>
                        <span className="bracketLabel">[V_C_26]</span>
                    </nav>
                    <span className="landingBrand">VideoCircle®</span>
                    <span className="bracketLabel">[LOBBY]</span>
                </header>
                <div className={styles.lobbyMain}>
                    <h2>Enter into Lobby</h2>
                    <div className={styles.lobbyCard}>
                        <div className={styles.lobbyInputRow}>
                            <TextField
                                id="outlined-basic"
                                label="Your Name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                variant="outlined"
                                size="small"
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        background: 'rgba(212,160,23,0.03)',
                                        color: '#D4A017',
                                        borderRadius: 0,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: '0.87rem',
                                        '& fieldset': { borderColor: 'rgba(212,160,23,0.25)', borderRadius: 0 },
                                        '&:hover fieldset': { borderColor: 'rgba(212,160,23,0.6)' },
                                        '&.Mui-focused fieldset': { borderColor: '#D4A017', borderWidth: '1px' },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(212,160,23,0.45)',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: '0.82rem',
                                        letterSpacing: '0.06em',
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#D4A017' },
                                    '& .MuiInputBase-input': {
                                        color: '#D4A017',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        letterSpacing: '0.08em',
                                    },
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleJoin}
                                disabled={connecting || !username.trim()}
                                sx={{
                                    background: '#D4A017',
                                    color: '#080808',
                                    fontWeight: 700,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    letterSpacing: '0.06em',
                                    textTransform: 'none',
                                    borderRadius: 0,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        background: '#080808',
                                        color: '#D4A017',
                                        boxShadow: 'inset 0 0 0 1px #D4A017',
                                    },
                                    '&.Mui-disabled': {
                                        background: 'rgba(212,160,23,0.25)',
                                        color: 'rgba(8,8,8,0.5)',
                                    },
                                }}
                            >
                                {connecting ? '[...]' : '[JOIN]'}
                            </Button>
                        </div>

                        {error && (
                            <p style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.75rem',
                                color: '#D4A017',
                                opacity: 0.7,
                                margin: 0,
                                letterSpacing: '0.04em',
                            }}>
                                [ERR] {error}
                            </p>
                        )}

                        <video className={styles.lobbyVideo} ref={localVideoRef} autoPlay muted />

                        <div className={styles.lobbyMediaControls}>
                            <button
                                type="button"
                                disabled={videoPending || !videoAvailable}
                                className={`${styles.lobbyMediaBtn} ${
                                    videoPending || !videoAvailable || !video
                                        ? styles.lobbyMediaBtnOff
                                        : styles.lobbyMediaBtnOn
                                }`}
                                onClick={() => setVideo((v) => !v)}
                            >
                                {videoPending ? '[connecting...]' : '[camera]'}
                            </button>
                            <button
                                type="button"
                                disabled={audioPending || !audioAvailable}
                                className={`${styles.lobbyMediaBtn} ${
                                    audioPending || !audioAvailable || !audio
                                        ? styles.lobbyMediaBtnOff
                                        : styles.lobbyMediaBtnOn
                                }`}
                                onClick={() => setAudio((a) => !a)}
                            >
                                {audioPending ? '[connecting...]' : '[mic]'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
