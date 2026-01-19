'use client';

import { Palette } from 'lucide-react';
import { toast } from 'sonner';

import { useThemeContext } from '@/components/theme-provider';
import { Card, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function Page() {
    const { theme, setTheme } = useThemeContext();

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        toast.success(`Theme changed to ${newTheme}`);
    };

    const UpdateTitle = () => {
        try {
            if (typeof window === 'undefined') return null;

            import('@tauri-apps/api/window').then((tauri) => {
                tauri.getCurrentWindow().setTitle('PAW ~ Configuration ~ Appearance');
            });
        } catch (error) {}

        return null;
    };

    return (
        <div>
            <UpdateTitle />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center gap-3 mb-8">
                    <Palette className="h-8 w-8" />
                    <h1 className="text-4xl font-bold">Appearance</h1>
                </div>

                <Card className="mb-6">
                    <CardHeader className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="theme" className="text-base">Theme</Label>
                            <div className="flex gap-2">
                                <Select value={theme} onValueChange={handleThemeChange}>
                                    <SelectTrigger id="theme" className="w-[180px]">
                                        <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="modstmous">Modstmous</SelectItem>
                                        <SelectItem value="puppyDark">Puppy Dark</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
};