"use client";

import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Lock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOthers, useSelf, useMutation } from "@liveblocks/react/suspense";

interface VoiceState {
    isInCall: boolean;
    isMuted: boolean;
    isSpeaking: boolean;
}

export function WhiteboardVoicePanel({ courseId }: { courseId: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Use ref to track speaking state inside the loop without re-triggering effect
    const isSpeakingRef = useRef(false);

    const others = useOthers();

    const updateVoiceState = useMutation(
        ({ setMyPresence, self }, newState: Partial<VoiceState>) => {
            const currentVoiceState = self.presence.voiceState || { isInCall: false, isMuted: false, isSpeaking: false };
            setMyPresence({ voiceState: { ...currentVoiceState, ...newState } });
        },
        []
    );

    // Start voice detection
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

            const speaking = average > 20; // Threshold for speaking detection
            const now = Date.now();

            // Only update state if it changed
            if (speaking !== isSpeakingRef.current) {
                if (speaking || (now - lastSpeakTime > 500)) { // Debounce stop speaking
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
            setIsInCall(true);
            updateVoiceState({ isInCall: true, isMuted: false, isSpeaking: false });

            toast({
                title: "Joined voice chat",
                description: "You are now in the voice channel",
            });
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast({
                title: "Microphone access denied",
                description: "Please allow microphone access to join voice chat",
                variant: "destructive",
            });
        }
    };

    const leaveCall = () => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }
        setIsInCall(false);
        setIsMuted(false);
        setIsSpeaking(false);
        updateVoiceState({ isInCall: false, isMuted: false, isSpeaking: false });

        toast({
            title: "Left voice chat",
            description: "You have disconnected from the voice channel",
        });
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

    // Count users in voice call
    const usersInCall = others.filter((other) => {
        const otherVoiceState = other.presence.voiceState as VoiceState | undefined;
        return otherVoiceState?.isInCall;
    }).length + (isInCall ? 1 : 0);

    const speakingUsers = others.filter((other) => {
        const otherVoiceState = other.presence.voiceState as VoiceState | undefined;
        return otherVoiceState?.isInCall && otherVoiceState?.isSpeaking;
    });

    return (
        <div className="fixed top-20 right-6 z-40">
            {/* Voice Status Panel */}
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

                    {/* Users in call */}
                    <div className="space-y-2">
                        {isInCall && (
                            <div className="flex items-center gap-2 p-2 rounded bg-primary/10">
                                <div className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                                <span className="text-sm">You {isMuted && "(muted)"}</span>
                                {isSpeaking && <span className="text-xs text-green-600">Speaking</span>}
                            </div>
                        )}
                        {speakingUsers.map((other) => (
                            <div key={other.connectionId} className="flex items-center gap-2 p-2 rounded">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm">{other.info?.name || "User"}</span>
                                <span className="text-xs text-green-600">Speaking</span>
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 mt-4">
                        {!isInCall ? (
                            <Button onClick={joinCall} className="w-full" size="sm">
                                <Phone className="h-4 w-4 mr-2" />
                                Join Voice
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={toggleMute}
                                    variant={isMuted ? "destructive" : "secondary"}
                                    size="sm"
                                    className="flex-1"
                                >
                                    {isMuted ? (
                                        <MicOff className="h-4 w-4" />
                                    ) : (
                                        <Mic className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button
                                    onClick={leaveCall}
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <PhoneOff className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Join Button when not in call and no one else is */}
            {!isInCall && usersInCall === 0 && (
                <Button
                    onClick={joinCall}
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg relative"
                    variant="secondary"
                >
                    <Phone className="h-6 w-6" />
                </Button>
            )}
        </div>
    );
}
