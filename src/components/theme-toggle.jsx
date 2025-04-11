'use client';

import { MoonIcon, SunIcon, StarIcon } from '@radix-ui/react-icons';
import { PawPrint } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function ToggleTheme() {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    {theme === 'light' && <SunIcon className="h-[1.2rem] w-[1.2rem]" />}
                    {theme === 'dark' && <MoonIcon className="h-[1.2rem] w-[1.2rem]" />}
                    {theme === 'modstmous' && <StarIcon className="h-[1.2rem] w-[1.2rem]" />}
                    {theme === 'puppyDark' && <PawPrint className="h-[1.2rem] w-[1.2rem]" />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('modstmous')}>
                    Modstmous
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('puppyDark')}>
                    Subby_Puppy
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};