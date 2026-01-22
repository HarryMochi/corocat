
"use client";

import Logo from './logo';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

// This component is no longer directly used in learn/page.tsx, but kept for potential future use.
export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
    return (
        <header className="md:hidden sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={onMenuClick}>
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                </Button>
                <div className="flex-1">
                    <Link href="/">
                        <Logo />
                    </Link>
                </div>
            </div>
        </header>
    );
}
