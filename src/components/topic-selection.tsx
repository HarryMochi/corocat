"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Wind,
  Zap,
  Users,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Logo from "./logo";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { User } from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFriends } from "@/app/getFriendClient";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  topic: z.string().min(2).max(50),
});

type TopicFormValues = z.infer<typeof formSchema>;

export default function TopicSelection() {
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "" },
  });

  const [questionStep, setQuestionStep] = useState(0);
  const [knowledgeLevel, setKnowledgeLevel] = useState("Beginner");
  const [masteryLevel, setMasteryLevel] = useState("Normal Path");
  const [additionalComments, setAdditionalComments] = useState("");
  const [courseMode, setCourseMode] = useState<"Solo" | "Collaborative">("Solo");

  const [friends, setFriends] = useState<(User & { id: string })[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<(User & { id: string })[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  useEffect(() => {
    fetchSocialsData();
  }, []);

  async function fetchSocialsData() {
    if (!user) return;
    setIsLoadingFriends(true);
    try {
      const friendsData = await getFriends(user.uid);
      setFriends(friendsData as (User & { id: string })[]);
    } finally {
      setIsLoadingFriends(false);
    }
  }

  const toggleFriend = (friend: User & { id: string }) => {
    setInvitedFriends(prev =>
      prev.some(f => f.id === friend.id)
        ? prev.filter(f => f.id !== friend.id)
        : [...prev, friend]
    );
  };

  const handleFinalSubmit = () => {
    const topic = form.getValues("topic");
    if (!topic) return;

    const params = new URLSearchParams({
      topic,
      knowledgeLevel,
      masteryLevel,
      additionalComments,
      courseMode,
      invitedFriends: JSON.stringify(invitedFriends),
    });

    router.push(`/course-generation?${params.toString()}`);
  };

  const handleBack = () => {
    if (questionStep === 1) {
      setInvitedFriends([]);
      setCourseMode("Solo");
    }
    setQuestionStep(prev => Math.max(0, prev - 1));
  };

  const onSubmit = () => setQuestionStep(1);

  const renderQuestionnaire = () => {
    switch (questionStep) {

      /* ---------- COURSE MODE ---------- */
      case 1:
        return (
          <div className="space-y-6 text-center">
            <h3 className="font-semibold text-lg">Choose course mode</h3>

            <RadioGroup
              value={courseMode}
              onValueChange={(val) => {
                setCourseMode(val as any);
                if (val === "Solo") setInvitedFriends([]);
              }}
              className="grid grid-cols-2 gap-4"
            >
              <Label className={cn("border p-4 rounded-md cursor-pointer",
                courseMode === "Solo" && "border-primary ring-2 ring-primary")}>
                <RadioGroupItem value="Solo" className="sr-only" />
                Solo
              </Label>

              <Label className={cn("border p-4 rounded-md cursor-pointer flex items-center justify-center gap-2",
                courseMode === "Collaborative" && "border-primary ring-2 ring-primary")}>
                <RadioGroupItem value="Collaborative" className="sr-only" />
                <Users className="h-4 w-4" /> Collaborative
              </Label>
            </RadioGroup>

            {courseMode === "Collaborative" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Select Friends</Button>
                </PopoverTrigger>

                <PopoverContent className="w-80 max-h-72 overflow-y-auto">
                  {isLoadingFriends ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {friends.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={friend.photoURL} />
                              <AvatarFallback>{friend.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{friend.displayName}</span>
                          </div>
                          <Checkbox
                            checked={invitedFriends.some(f => f.id === friend.id)}
                            onCheckedChange={() => toggleFriend(friend)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            <Button
              disabled={courseMode === "Collaborative" && invitedFriends.length === 0}
              onClick={() => {
                if (courseMode === "Collaborative") {
                  handleFinalSubmit(); // 🚀 INSTANT GENERATE
                } else {
                  setQuestionStep(2);
                }
              }}
            >
              Next
            </Button>
          </div>
        );

      /* ---------- KNOWLEDGE LEVEL ---------- */
      case 2:
        return (
          <div className="space-y-6 text-center">
            <h3 className="font-semibold text-lg">How well do you know this topic?</h3>

            <RadioGroup
              value={knowledgeLevel}
              onValueChange={setKnowledgeLevel}
              className="flex justify-center gap-4"
            >
              {["Beginner", "Intermediate", "Advanced"].map(level => (
                <Label key={level} className={cn(
                  "border p-4 rounded-md cursor-pointer w-28",
                  knowledgeLevel === level && "border-primary ring-2 ring-primary"
                )}>
                  <RadioGroupItem value={level} className="sr-only" />
                  {level}
                </Label>
              ))}
            </RadioGroup>

            <Button onClick={() => setQuestionStep(3)}>Next</Button>
          </div>
        );

      /* ---------- DEPTH ---------- */
      case 3:
        return (
          <div className="space-y-6 text-center">
            <h3 className="font-semibold text-lg">How deep do you want to go?</h3>

            <RadioGroup
              value={masteryLevel}
              onValueChange={setMasteryLevel}
              className="grid grid-cols-2 gap-4"
            >
              <Label className={cn("border p-4 rounded-md",
                masteryLevel === "Quick Overview" && "border-primary ring-2 ring-primary")}>
                <RadioGroupItem value="Quick Overview" className="sr-only" />
                <Wind /> Quick Overview
              </Label>

              <Label className={cn("border p-4 rounded-md",
                masteryLevel === "Normal Path" && "border-primary ring-2 ring-primary")}>
                <RadioGroupItem value="Normal Path" className="sr-only" />
                <Zap /> Normal Path
              </Label>
            </RadioGroup>

            <Button onClick={() => setQuestionStep(4)}>Next</Button>
          </div>
        );

      /* ---------- COMMENTS ---------- */
      case 4:
        return (
          <div className="space-y-6 text-center">
            <Textarea
              placeholder="Any special requests?"
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
            />
            <Button onClick={handleFinalSubmit}>Generate My Course</Button>
          </div>
        );

      default:
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="e.g. React, Python" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Start</Button>
            </form>
          </Form>
        );
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="flex justify-center mb-8">
        <Logo />
      </div>

      <Card>
        <CardHeader className="text-center">
          {questionStep > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <CardTitle>What do you want to master today?</CardTitle>
          <CardDescription>AI-generated personalized course</CardDescription>
        </CardHeader>

        <CardContent>{renderQuestionnaire()}</CardContent>
      </Card>
    </div>
  );
}
