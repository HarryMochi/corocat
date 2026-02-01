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

    // Refs for stable access in callbacks
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const isInCallRef = useRef(false); // Critical: Tracks call state for listeners
    const isSpeakingRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    const others = useOthers();
    const self = useSelf();

    const updateVoiceState = useMutation(
        ({ setMyPresence, self }, newState: Partial<VoiceState>) => {
            const currentVoiceState = self.presence.voiceState || { isInCall: false, isMuted: false, isSpeaking: false };
            setMyPresence({ voiceState: { ...currentVoiceState, ...newState } });
        },
        []
    );

    const createPeerConnection = (targetUserId: string) => {
        if (peersRef.current.has(targetUserId)) {
            console.log("Using existing connection for", targetUserId);
            return peersRef.current.get(targetUserId);
        }

        console.log("Creating new PeerConnection for", targetUserId);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                broadcast({
                    type: "signal",
                    targetUserId,
                    payload: { type: "candidate", candidate: event.candidate }
                });
            }
        };

        pc.ontrack = (event) => {
            console.log("Received remote track from", targetUserId);
            const stream = event.streams[0];
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetUserId, stream);
                return newMap;
            });
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${targetUserId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
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

    // Event Listener for Signaling
    useEventListener(({ event, connectionId }) => {
        if (!isInCallRef.current || !localStreamRef.current) return;

        const signal = event as any;
        const senderId = String(connectionId);

        // 1. New Peer Joined -> I initiate offer
        if (signal.type === "new-peer") {
            console.log("New peer joined:", senderId);
            const pc = createPeerConnection(senderId);
            if (pc) {
                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => {
                        console.log("Sending offer to", senderId);
                        broadcast({
                            type: "signal",
                            targetUserId: senderId,
                            payload: { type: "offer", sdp: pc.localDescription }
                        });
                    })
                    .catch(e => console.error("Error creating offer:", e));
            }
            return;
        }

        // 2. Received Signal (Offer/Answer/Candidate) targeting ME
        if (signal.type === "signal" && String(signal.targetUserId) === String(self.connectionId)) {
            const payload = signal.payload;
            const pc = createPeerConnection(senderId);
            if (!pc) return;

            if (payload.type === "offer") {
                console.log("Received offer from", senderId);
                pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    .then(() => pc.createAnswer())
                    .then(answer => pc.setLocalDescription(answer))
                    .then(() => {
                        console.log("Sending answer to", senderId);
                        broadcast({
                            type: "signal",
                            targetUserId: senderId,
                            payload: { type: "answer", sdp: pc.localDescription }
                        });
                    })
                    .catch(e => console.error("Error handling offer:", e));
            }
            else if (payload.type === "answer") {
                console.log("Received answer from", senderId);
                pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    .catch(e => console.error("Error setting remote description (answer):", e));
            }
            else if (payload.type === "candidate") {
                // console.log("Received ICE candidate from", senderId);
                pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                    .catch(e => console.error("Error adding ICE candidate:", e));
            }
        }
    });

    // Voice Volume Detection Logic
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

            if (isInCallRef.current) { // Use Ref here too for safety
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
            console.log("Joining call...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            setLocalStream(stream);
            localStreamRef.current = stream;

            setIsInCall(true);
            isInCallRef.current = true; // Update Ref

            updateVoiceState({ isInCall: true, isMuted: false, isSpeaking: false });

            // Announce presence
            broadcast({ type: "new-peer", userId: String(self.connectionId) });

            toast({ title: "Joined voice chat" });
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast({ title: "Microphone access denied", variant: "destructive" });
        }
    };

    const leaveCall = () => {
        console.log("Leaving call...");

        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
            localStreamRef.current = null;
        }

        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setRemoteStreams(new Map());

        setIsInCall(false);
        isInCallRef.current = false; // Update Ref

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

    // Count UI
    const usersInCall = others.filter((other) => {
        return (other.presence.voiceState as any)?.isInCall;
    }).length + (isInCall ? 1 : 0);

    const speakingUsers = others.filter((other) => {
        return (other.presence.voiceState as any)?.isInCall && (other.presence.voiceState as any)?.isSpeaking;
    });

    return (
        <div className="fixed top-20 right-6 z-40">
            {/* Remote Audio Elements */}
            {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                <audio
                    key={peerId}
                    ref={el => {
                        if (el && el.srcObject !== stream) {
                            el.srcObject = stream;
                            // Ensure it plays even if browser blocks implicit autoplay
                            el.play().catch(e => console.error("Audio play failed:", e));
                        }
                    }}
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
