import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import styles from '../styles/videoComponent.module.css';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicOffIcon from '@mui/icons-material/MicOff';
import LobbyScreen from '../components/meet/LobbyScreen';
import MeetControls from '../components/meet/MeetControls';
import ChatPanel from '../components/meet/ChatPanel';
import ConferenceGrid from '../components/meet/ConferenceGrid';
import server from '../environment';

// ── Local video picture-in-picture ──────────────────────────────────────────
// Must be rendered inside <LiveKitRoom> so useLocalParticipant is in context.
function LocalVideoPIP() {
    const { isCameraEnabled, isMicrophoneEnabled, localParticipant } = useLocalParticipant();
    const videoRef = useRef(null);
    const cameraTrack = localParticipant?.cameraTrack?.track;

    useEffect(() => {
        if (!cameraTrack || !videoRef.current) return;
        cameraTrack.attach(videoRef.current);
        const el = videoRef.current;
        return () => cameraTrack.detach(el);
    }, [cameraTrack]);

    return (
        <div className={styles.meetUserVideoWrapper}>
            <video className={styles.meetUserVideo} ref={videoRef} autoPlay muted />
            {!isCameraEnabled && (
                <div className={styles.videoOffOverlay}>
                    <VideocamOffIcon />
                </div>
            )}
            {!isMicrophoneEnabled && (
                <div className={styles.micOffBadge}>
                    <MicOffIcon />
                </div>
            )}
        </div>
    );
}

// ── In-room layout ───────────────────────────────────────────────────────────
// Also inside <LiveKitRoom>.
function RoomView({ onEndCall }) {
    const [showModal, setModal] = useState(false);
    const [newMessages, setNewMessages] = useState(0);
    const showModalRef = useRef(showModal);
    showModalRef.current = showModal;

    const handleSetModal = useCallback((v) => {
        setModal(v);
        if (v) setNewMessages(0);
    }, []);

    const handleNewMessage = useCallback(() => {
        if (!showModalRef.current) setNewMessages((n) => n + 1);
    }, []);

    return (
        <div className={styles.meetVideoContainer}>
            <div className={styles.meetMainArea}>
                <ConferenceGrid />
                <LocalVideoPIP />
                <MeetControls
                    showModal={showModal}
                    newMessages={newMessages}
                    setModal={handleSetModal}
                    handleEndCall={onEndCall}
                />
            </div>
            <ChatPanel
                showModal={showModal}
                setModal={handleSetModal}
                onNewMessage={handleNewMessage}
            />
        </div>
    );
}

// ── Page root ────────────────────────────────────────────────────────────────
export default function VideoMeetComponent() {
    const { meetingCode } = useParams();
    const navigate = useNavigate();

    const [phase, setPhase] = useState('lobby'); // 'lobby' | 'connecting' | 'room'
    const [token, setToken] = useState('');
    const [mediaPrefs, setMediaPrefs] = useState({ video: true, audio: true });
    const [error, setError] = useState('');

    const handleJoin = useCallback(async (username, prefs) => {
        setPhase('connecting');
        setError('');
        try {
            const res = await fetch(
                `${server}/api/v1/meet/get-token` +
                `?room=${encodeURIComponent(meetingCode)}` +
                `&username=${encodeURIComponent(username)}`
            );
            if (!res.ok) throw new Error('Could not get room token');
            const { token: jwt } = await res.json();
            setMediaPrefs(prefs);
            setToken(jwt);
            setPhase('room');
        } catch (err) {
            setError(err.message);
            setPhase('lobby');
        }
    }, [meetingCode]);

    if (phase !== 'room') {
        return (
            <LobbyScreen
                connecting={phase === 'connecting'}
                error={error}
                onJoin={handleJoin}
                navigate={navigate}
            />
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={process.env.REACT_APP_LIVEKIT_URL}
            connect
            audio={mediaPrefs.audio}
            video={mediaPrefs.video}
            onDisconnected={() => navigate('/')}
            style={{ display: 'contents' }}
        >
            <RoomView onEndCall={() => navigate('/')} />
        </LiveKitRoom>
    );
}
