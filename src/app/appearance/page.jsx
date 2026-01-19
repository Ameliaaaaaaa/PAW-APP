'use client';

import { useState, useEffect } from 'react';
import { Palette, Plus, Trash2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useThemeContext } from '@/components/theme-provider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

const defaultThemeColors = {
    background: '270 15% 5%',
    foreground: '0 0% 98%',
    card: '270 15% 8%',
    'card-foreground': '0 0% 98%',
    popover: '270 15% 8%',
    'popover-foreground': '0 0% 98%',
    primary: '339 90% 51%',
    'primary-foreground': '0 0% 100%',
    secondary: '270 15% 12%',
    'secondary-foreground': '0 0% 98%',
    muted: '270 15% 12%',
    'muted-foreground': '240 5% 64.9%',
    accent: '339 90% 51%',
    'accent-foreground': '0 0% 98%',
    destructive: '0 62.8% 30.6%',
    'destructive-foreground': '0 0% 98%',
    border: '270 15% 15%',
    input: '270 15% 15%',
    ring: '339 90% 51%',
};

const colorLabels = {
    background: 'Background',
    foreground: 'Foreground Text',
    card: 'Card Background',
    'card-foreground': 'Card Text',
    primary: 'Primary Color',
    'primary-foreground': 'Primary Text',
    secondary: 'Secondary Color',
    'secondary-foreground': 'Secondary Text',
    muted: 'Muted Background',
    'muted-foreground': 'Muted Text',
    accent: 'Accent Color',
    'accent-foreground': 'Accent Text',
    border: 'Border Color',
    input: 'Input Background',
    ring: 'Focus Ring',
};

// Convert HSL string to hex color
const hslToHex = (hsl) => {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
    const sDecimal = s / 100;
    const lDecimal = l / 100;

    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lDecimal - c/2;

    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    const toHex = (n) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Convert hex color to HSL string
const hexToHsl = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
};

export default function Page() {
    const { theme, setTheme, customThemes, setCustomThemes, applyCustomTheme, resetCustomTheme } = useThemeContext();
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [currentCustomTheme, setCurrentCustomTheme] = useState({ ...defaultThemeColors });
    const [customThemeName, setCustomThemeName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [themeToDelete, setThemeToDelete] = useState('');

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        toast.success(`Theme changed to ${newTheme}`);
    };

    const handleColorChange = (colorKey, hexValue) => {
        const hslValue = hexToHsl(hexValue);
        setCurrentCustomTheme(prev => ({
            ...prev,
            [colorKey]: hslValue
        }));
    };

    const previewCustomTheme = () => {
        applyCustomTheme(currentCustomTheme);
        toast.success('Preview applied');
    };

    const handleSaveCustomTheme = () => {
        if (!customThemeName.trim()) {
            toast.error('Please enter a theme name');
            return;
        }

        const themeName = `custom-${customThemeName.toLowerCase().replace(/\s+/g, '-')}`;
        const updatedCustomThemes = {
            ...customThemes,
            [themeName]: { ...currentCustomTheme }
        };

        setCustomThemes(updatedCustomThemes);
        localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));

        setTheme(themeName);

        setShowSaveDialog(false);
        setCustomThemeName('');
        setIsCustomizing(false);

        toast.success('Custom theme saved successfully!');
    };

    const handleDeleteTheme = () => {
        const updatedCustomThemes = { ...customThemes };
        delete updatedCustomThemes[themeToDelete];

        setCustomThemes(updatedCustomThemes);
        localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));

        // If we're deleting the currently active theme, switch to dark
        if (theme === themeToDelete) {
            setTheme('dark');
            toast.success('Theme deleted and switched to Dark theme');
        } else {
            toast.success('Theme deleted successfully');
        }

        setShowDeleteDialog(false);
        setThemeToDelete('');
    };

    const exportTheme = (themeName) => {
        const themeData = customThemes[themeName];
        const dataStr = JSON.stringify({ name: themeName, colors: themeData }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${themeName}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Theme exported successfully');
    };

    const importTheme = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                const themeName = imported.name || `imported-${Date.now()}`;

                const updatedCustomThemes = {
                    ...customThemes,
                    [themeName]: imported.colors
                };

                setCustomThemes(updatedCustomThemes);
                localStorage.setItem('customThemes', JSON.stringify(updatedCustomThemes));
                toast.success('Theme imported successfully');
            } catch (error) {
                toast.error('Failed to import theme');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
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
                                        {Object.keys(customThemes).map(themeName => (
                                            <SelectItem key={themeName} value={themeName}>
                                                {themeName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={() => setIsCustomizing(!isCustomizing)}
                                    variant="outline"
                                    size="icon"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => document.getElementById('import-theme').click()}
                                >
                                    <Upload className="h-4 w-4" />
                                </Button>
                                <input
                                    id="import-theme"
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={importTheme}
                                />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {isCustomizing && (
                    <Card className="mb-6">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Create Custom Theme</h3>
                            <p className="text-sm text-muted-foreground">
                                Customize colors to create your own theme
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                                {Object.entries(currentCustomTheme).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <Label className="text-sm">{colorLabels[key] || key}</Label>
                                        </div>
                                        <input
                                            type="color"
                                            value={hslToHex(value)}
                                            onChange={(e) => handleColorChange(key, e.target.value)}
                                            className="w-16 h-10 rounded cursor-pointer border-2 border-border"
                                        />
                                        <code className="text-xs text-muted-foreground w-32">
                                            {value}
                                        </code>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-4 border-t">
                                <Button onClick={previewCustomTheme} variant="outline" className="flex-1">
                                    Preview
                                </Button>
                                <Button onClick={() => setShowSaveDialog(true)} className="flex-1">
                                    Save Theme
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsCustomizing(false);
                                        setCurrentCustomTheme({ ...defaultThemeColors });
                                        resetCustomTheme();
                                        setTheme(theme);
                                    }}
                                    variant="ghost"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {Object.keys(customThemes).length > 0 && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Manage Custom Themes</h3>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {Object.keys(customThemes).map(themeName => (
                                <div key={themeName} className="flex items-center justify-between p-3 border rounded-lg">
                                    <span className="font-medium">{themeName}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => exportTheme(themeName)}
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            Export
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                                setThemeToDelete(themeName);
                                                setShowDeleteDialog(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Custom Theme</DialogTitle>
                        <DialogDescription>
                            Give your custom theme a name
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="My Custom Theme"
                        value={customThemeName}
                        onChange={(e) => setCustomThemeName(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveCustomTheme}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Theme</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{themeToDelete}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteTheme}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}