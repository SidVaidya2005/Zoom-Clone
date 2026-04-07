import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import server from '../environment';
import useASCIICanvas from './useASCIICanvas';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};

export default function useVideoMeet() {
    const navigate = useNavigate();

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState(false);
    let [audio, setAudio] = useState(false);
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(true);
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(3);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    const videoRef = useRef([]);
    const lobbyCanvasRef = useASCIICanvas();

    let [videos, setVideos] = useState([]);

    useEffect(() => {
        getPermissions();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup on unmount: close all peer connections, stop local tracks, disconnect socket
    useEffect(() => {
        return () => {
            Object.values(connections).forEach(pc => {
                if (pc) {
                    pc.ontrack = null;
                    pc.onicecandidate = null;
                    pc.close();
                }
            });
            Object.keys(connections).forEach(id => delete connections[id]);

            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }

            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Add local tracks to a peer connection only once (avoid duplicate senders)
    const attachLocalTracksOnce = (pc, stream) => {
        const existingTrackIds = new Set(
            pc.getSenders().map(s => s.track && s.track.id).filter(Boolean)
        );
        stream.getTracks().forEach(track => {
            if (!existingTrackIds.has(track.id)) {
                pc.addTrack(track, stream);
            }
        });
    };

    // Replace outgoing tracks on all peer connections using replaceTrack (no renegotiation needed)
    const replaceOutgoingTracks = (newStream) => {
        Object.values(connections).forEach(pc => {
            if (!pc) return;
            const senders = pc.getSenders();
            const newVideo = newStream.getVideoTracks()[0] || null;
            const newAudio = newStream.getAudioTracks()[0] || null;
            senders.forEach(sender => {
                if (!sender.track) return;
                if (sender.track.kind === 'video') sender.replaceTrack(newVideo).catch(e => console.log(e));
                if (sender.track.kind === 'audio') sender.replaceTrack(newAudio).catch(e => console.log(e));
            });
        });
    };

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e));
            }
        }
    };

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                videoPermission.getTracks().forEach(track => track.stop());
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                audioPermission.getTracks().forEach(track => track.stop());
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio]); // eslint-disable-line react-hooks/exhaustive-deps

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) { console.log(e); }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        // Replace outgoing tracks on existing connections without triggering renegotiation
        replaceOutgoingTracks(stream);

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e); }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoref.current.srcObject = window.localStream;

            replaceOutgoingTracks(window.localStream);
        });
    };

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e));
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { }
        }
    };

    let getDislayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) { console.log(e); }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        // Replace outgoing tracks on existing connections without triggering renegotiation
        replaceOutgoingTracks(stream);

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e); }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoref.current.srcObject = window.localStream;

            getUserMedia();
        });
    };

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    };

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                if (connections[id]) {
                    connections[id].ontrack = null;
                    connections[id].onicecandidate = null;
                    connections[id].close();
                    delete connections[id];
                }
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };

                    connections[socketListId].ontrack = (event) => {
                        const remoteStream = event.streams[0];
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {

                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: remoteStream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: remoteStream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        attachLocalTracksOnce(connections[socketListId], window.localStream);
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        attachLocalTracksOnce(connections[socketListId], window.localStream);
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                                })
                                .catch(e => console.log(e));
                        });
                    }
                }
            });
        });
    };

    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    let handleVideo = () => {
        setVideo(!video);
    };

    let handleAudio = () => {
        setAudio(!audio);
    };

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

    let handleScreen = () => {
        setScreen(!screen);
    };

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { }

        Object.values(connections).forEach(pc => {
            if (pc) {
                pc.ontrack = null;
                pc.onicecandidate = null;
                pc.close();
            }
        });
        Object.keys(connections).forEach(id => delete connections[id]);

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        window.location.href = "/";
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    };

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    };

    return {
        localVideoref,
        lobbyCanvasRef,
        videoAvailable,
        audioAvailable,
        video,
        setVideo,
        audio,
        setAudio,
        screen,
        showModal,
        setModal,
        screenAvailable,
        messages,
        message,
        setMessage,
        newMessages,
        askForUsername,
        username,
        setUsername,
        videos,
        handleVideo,
        handleAudio,
        handleScreen,
        handleEndCall,
        sendMessage,
        connect,
        navigate,
    };
}
