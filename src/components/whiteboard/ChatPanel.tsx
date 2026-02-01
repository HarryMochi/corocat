"use client";

import { MessageSquare, Mic, MicOff, X, Lock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isPremiumUser, showPremiumUpgradePrompt } from "@/lib/premium";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useOthers, useSelf } from "@liveblocks/react/suspense";
import { LiveList, LiveObject } from "@liveblocks/client";

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    message: string;
    timestamp: number;
}

export function WhiteboardChatPanel({ courseId }: { courseId: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const isPremium = user ? isPremiumUser(user) : false;

    // Liveblocks storage for messages
    const messages = useSelf((me) => me.presence.chatMessages) || [];
    const others = useOthers();

    const sendMessage = useMutation(
        ({ self, setMyPresence, storage }) => {
            if (!message.trim() || !user) return;

            const newMessage: ChatMessage = {
                id: `${Date.now()}-${user.uid}`,
                userId: user.uid,
                userName: user.displayName || "Anonymous",
                userAvatar: user.photoURL || undefined,
                message: message.trim(),
                timestamp: Date.now(),
            };

            // Get current messages from storage or create new array
            const currentMessages = self.presence.chatMessages || [];
            const updatedMessages = [...currentMessages, newMessage];

            setMyPresence({ chatMessages: updatedMessages });
            setMessage("");
        },
        [message, user]
    );

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPremium) {
            const prompt = showPremiumUpgradePrompt();
            toast({
                title: prompt.title,
                description: prompt.message,
                variant: "destructive",
            });
            return;
        }
        sendMessage();
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const toggleChat = () => {
        if (!isPremium) {
            const prompt = showPremiumUpgradePrompt();
            toast({
                title: prompt.title,
                description: prompt.message,
                variant: "destructive",
            });
            return;
        }
        setIsOpen(!isOpen);
    };

    // Collect all messages from all users
    const allMessages: ChatMessage[] = [
        ...(messages || []),
        ...others.flatMap((other) => other.presence.chatMessages || []),
    ].sort((a, b) => a.timestamp - b.timestamp);

    return (
        <>
            {/* Chat Toggle Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={toggleChat}
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg relative"
                    variant={isOpen ? "secondary" : "default"}
                >
                    <MessageSquare className="h-6 w-6" />
                    {!isPremium && (
                        <Lock className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                    )}
                </Button>
            </div>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-background border rounded-lg shadow-xl z-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            <h3 className="font-semibold">Chat</h3>
                            <span className="text-xs text-muted-foreground">
                                ({others.length + 1} online)
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {allMessages.length === 0 ? (
                                <p className="text-center text-muted-foreground text-sm py-8">
                                    No messages yet. Start the conversation!
                                </p>
                            ) : (
                                allMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-3 ${msg.userId === user?.uid ? "flex-row-reverse" : ""
                                            }`}
                                    >
                                        <div className="flex-shrink-0">
                                            {msg.userAvatar ? (
                                                <img
                                                    src={msg.userAvatar}
                                                    alt={msg.userName}
                                                    className="h-8 w-8 rounded-full"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                                                    {msg.userName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className={`flex-1 ${msg.userId === user?.uid ? "text-right" : ""
                                                }`}
                                        >
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-sm font-semibold">
                                                    {msg.userName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                            <div
                                                className={`inline-block px-3 py-2 rounded-lg ${msg.userId === user?.uid
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted"
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={!isPremium}
                            />
                            <Button type="submit" disabled={!isPremium || !message.trim()}>
                                Send
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
