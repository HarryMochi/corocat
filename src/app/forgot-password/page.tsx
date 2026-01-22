
"use client";

import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import React from "react";

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import AuthLayout from "@/components/auth-layout";
import Logo from "@/components/logo";
import { Loader2, Mail } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
})

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await sendPasswordReset(values.email);
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not send password reset email. Please try again.",
      });
    } finally {
        setIsLoading(false);
    }
  }

  if (isSubmitted) {
      return (
        <AuthLayout>
            <div className="mx-auto grid w-full max-w-sm items-center gap-6 text-center">
                <div className="lg:hidden">
                    <Link href="/">
                        <Logo />
                    </Link>
                </div>
                <div className="bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Check your email
                </h1>
                <p className="text-muted-foreground">
                    We've sent a password reset link to the email address you provided. Please check your inbox and spam folder.
                </p>
                <Button variant="outline" asChild>
                    <Link href="/login">Back to Login</Link>
                </Button>
            </div>
        </AuthLayout>
      )
  }

  return (
    <AuthLayout>
        <div className="mx-auto grid w-full max-w-sm items-center gap-6">
            <div className="lg:hidden">
              <Link href="/">
                <Logo />
              </Link>
            </div>
            <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                Forgot your password?
                </h1>
                <p className="text-sm text-muted-foreground">
                No problem. Enter your email and we'll send you a link to reset it.
                </p>
            </div>
            <div className="grid gap-4">
                <Form {...form}>
                    <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="grid gap-4"
                    >
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem className="grid gap-2">
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="name@example.com"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                {...field}
                                disabled={isLoading}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Link
                    </Button>
                    </form>
                </Form>
            </div>
            <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                href="/login"
                className="underline underline-offset-4 hover:text-primary"
                >
                Sign in
                </Link>
            </p>
        </div>
    </AuthLayout>
  )
}
