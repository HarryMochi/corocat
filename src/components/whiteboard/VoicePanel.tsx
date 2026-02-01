"use client";

import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOthers, useSelf, useMutation, useBroadcastEvent, useEventListener } from "@liveblocks/react/suspense";

interface VoiceState {
    isInCall: boolean;
    isMuted: boolean;
    isSpeaking: boolean;
}

interface PeerConnection {
    connection: RTCPeerConnection;
    stream?: MediaStream;
}

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" }
    ]
};

export function WhiteboardVoicePanel({ courseId }: { courseId: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const broadcast = useBroadcastEvent();

    // UI State
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // WebRTC State
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    // Refs
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const isSpeakingRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    const others = useOthers();
    const self = useSelf(); // Get full self object including connectionId

    // Liveblocks State mutation
    const updateVoiceState = useMutation(
        ({ setMyPresence, self }, newState: Partial<VoiceState>) => {
            const currentVoiceState = self.presence.voiceState || { isInCall: false, isMuted: false, isSpeaking: false };
            setMyPresence({ voiceState: { ...currentVoiceState, ...newState } });
        },
        []
    );

    // Helper to create peer connection
    const createPeerConnection = (targetUserId: string, initiator: boolean) => {
        if (peersRef.current.has(targetUserId)) return peersRef.current.get(targetUserId);

        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                broadcast({
                    type: "signal",
                    targetUserId,
                    payload: { type: "candidate", candidate: event.candidate }
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetUserId, event.streams[0]);
                return newMap;
            });
        };

        // Cleanup on close
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
                peersRef.current.delete(targetUserId);
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(targetUserId);
                    return newMap;
                });
            }
        };

        peersRef.current.set(targetUserId, pc);
        return pc;
    };

    // Handle incoming signals
    useEventListener(({ event }) => {
        if (!isInCall || !localStreamRef.current) return;

        const signal = event as any;

        // Handle "new-peer" event: Someone joined, so I should initiate connection to them
        if (signal.type === "new-peer") {
            const targetId = signal.userId;
            // Only initiate if we don't have a connection yet
            // To prevent dual-initiation, we can use simple ID comparison tie-breaker or just let the new joiner be the one who triggers the others (usually specific pattern needed).
            // Simplest Mesh: Existing peers initiate to New peer.
            // Or New peer initiates to All existing.
            // Let's use: The one who receives "new-peer" (existing user) initiates.
            const pc = createPeerConnection(targetId, true);
            if (pc) {
                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => {
                        broadcast({
                            type: "signal",
                            targetUserId: targetId,
                            payload: { type: "offer", sdp: pc.localDescription }
                        });
                    });
            }
            return;
        }

        // Handle direct signals
        if (signal.type === "signal" && signal.targetUserId === String(self.connectionId)) {
            // Find who sent this (we need source user info from event if possible, liveblocks wraps it)
            // Wait, useEventListener provides { user, connectionId, event }
            // So we can get sender from the wrapper.
            // But wait, the standard useEventListener callback argument structure
        }
    });

    // Liveblocks 2.0+ useEventListener signature is ({ event, user, connectionId })
    // I need to intercept the sender ID.
    useEventListener(({ event, connectionId }) => {
        if (!isInCall || !localStreamRef.current) return;
        const signal = event as any;
        const senderId = String(connectionId); // Using connectionId as the peer identifier

        if (signal.type === "new-peer") {
            // Someone joined. If I am in call, I initiate connection to them.
            // senderId is the new peer
            const pc = createPeerConnection(senderId, true);
            if (pc) {
                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => {
                        broadcast({
                            type: "signal",
                            targetUserId: senderId,
                            payload: { type: "offer", sdp: pc.localDescription }
                        });
                    })
                    .catch(console.error);
            }
        }
        else if (signal.type === "signal" && String(signal.targetUserId) === String(self.connectionId)) {
            const payload = signal.payload;
            const pc = createPeerConnection(senderId, false);
            if (!pc) return;

            if (payload.type === "offer") {
                pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    .then(() => pc.createAnswer())
                    .then(answer => pc.setLocalDescription(answer))
                    .then(() => {
                        broadcast({
                            type: "signal",
                            targetUserId: senderId,
                            payload: { type: "answer", sdp: pc.localDescription }
                        });
                    })
                    .catch(console.error);
            } else if (payload.type === "answer") {
                pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    .catch(console.error);
            } else if (payload.type === "candidate") {
                pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                    .catch(console.error);
            }
        }
    });

    // Voice Detection Logic (from previous step)
    useEffect(() => {
        if (!localStream || !isInCall) return;

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(localStream);

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        microphone.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let animationFrameId: number;
        let lastSpeakTime = 0;

        const detectSpeaking = () => {
            if (!analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

            const speaking = average > 20;
            const now = Date.now();

            if (speaking !== isSpeakingRef.current) {
                if (speaking || (now - lastSpeakTime > 500)) {
                    isSpeakingRef.current = speaking;
                    setIsSpeaking(speaking);
                    updateVoiceState({ isSpeaking: speaking });
                    if (speaking) lastSpeakTime = now;
                }
            }

            if (isInCall) {
                animationFrameId = requestAnimationFrame(detectSpeaking);
            }
        };

        detectSpeaking();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            audioContext.close();
        };
    }, [localStream, isInCall, updateVoiceState]);

    const joinCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            setLocalStream(stream);
            localStreamRef.current = stream;

            setIsInCall(true);
            updateVoiceState({ isInCall: true, isMuted: false, isSpeaking: false });

            // Announce join to others so they can initiate connections
            broadcast({ type: "new-peer", userId: String(self.connectionId) });

            toast({ title: "Joined voice chat" });
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast({ title: "Microphone access denied", variant: "destructive" });
        }
    };

    const leaveCall = () => {
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
            localStreamRef.current = null;
        }

        // Close all peer connections
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setRemoteStreams(new Map());

        setIsInCall(false);
        setIsMuted(false);
        setIsSpeaking(false);
        updateVoiceState({ isInCall: false, isMuted: false, isSpeaking: false });

        toast({ title: "Left voice chat" });
    };

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                updateVoiceState({ isMuted: !audioTrack.enabled });
            }
        }
    };

    // UI Rendering
    const usersInCall = others.filter((other) => {
        return (other.presence.voiceState as any)?.isInCall;
    }).length + (isInCall ? 1 : 0);

    const speakingUsers = others.filter((other) => {
        return (other.presence.voiceState as any)?.isInCall && (other.presence.voiceState as any)?.isSpeaking;
    });

    return (
        <div className="fixed top-20 right-6 z-40">
            {/* Hidden Audio Elements for Remote Streams */}
            {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                <audio
                    key={peerId}
                    ref={el => { if (el) el.srcObject = stream; }}
                    autoPlay
                    playsInline
                />
            ))}

            {usersInCall > 0 && (
                <div className="bg-background border rounded-lg shadow-lg p-4 mb-4 w-64">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">Voice Chat</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {usersInCall} {usersInCall === 1 ? "user" : "users"}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {isInCall && (
                            <div className="flex items-center gap-2 p-2 rounded bg-primary/10">
                                <div className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                                <span className="text-sm">You {isMuted && "(muted)"}</span>
                                {isSpeaking && <span className="text-xs text-green-600">Speaking</span>}
                            </div>
                        )}
                        {others.filter(o => (o.presence.voiceState as any)?.isInCall).map((other) => {
                            const isRemoteSpeaking = (other.presence.voiceState as any)?.isSpeaking;
                            return (
                                <div key={other.connectionId} className="flex items-center gap-2 p-2 rounded">
                                    <div className={`h-2 w-2 rounded-full ${isRemoteSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                    <span className="text-sm truncate max-w-[120px]">{other.info?.displayName || "User"}</span>
                                    {isRemoteSpeaking && <span className="text-xs text-green-600">Speaking</span>}
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex gap-2 mt-4">
                        {!isInCall ? (
                            <Button onClick={joinCall} className="w-full" size="sm">
                                <Phone className="h-4 w-4 mr-2" />
                                Join Voice
                            </Button>
                        ) : (
                            <>
                                <Button onClick={toggleMute} variant={isMuted ? "destructive" : "secondary"} size="sm" className="flex-1">
                                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </Button>
                                <Button onClick={leaveCall} variant="destructive" size="sm" className="flex-1">
                                    <PhoneOff className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {!isInCall && usersInCall === 0 && (
                <Button onClick={joinCall} size="lg" className="h-14 w-14 rounded-full shadow-lg relative" variant="secondary">
                    <Phone className="h-6 w-6" />
                </Button>
            )}
        </div>
    );
}
