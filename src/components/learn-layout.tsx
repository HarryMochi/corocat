
"use client";

import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import Logo from "./logo";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface LearnLayoutProps {
    sidebar: React.ReactNode;
    mainContent: React.ReactNode;
}

export default function LearnLayout({ sidebar, mainContent }: LearnLayoutProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const isMobile = useIsMobile();
    
    if (isMobile) {
        return (
            <div className="min-h-screen flex flex-col">
                <header className="sticky top-0 z-40 w-full border-b bg-background">
                    <div className="container flex h-16 items-center space-x-4">
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-80">
                                {sidebar}
                            </SheetContent>
                        </Sheet>
                        <div className="flex-1">
                            <Link href="/">
                                <Logo />
                            </Link>
                        </div>
                    </div>
                </header>
                <main className="flex-1">{mainContent}</main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            <aside className="w-80 border-r h-screen sticky top-0">
                {sidebar}
            </aside>
            <main className="flex-1 flex flex-col">
                <div className="flex-1 overflow-auto">
                    {mainContent}
                </div>
            </main>
        </div>
    )
}
