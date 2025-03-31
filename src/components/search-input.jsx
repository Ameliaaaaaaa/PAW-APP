'use client';

import { Search, Monitor, Smartphone, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SearchInput({ onSearch }) {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('name');
    const [currentPlatforms, setPlatforms] = useState([]);
    const [sortBy, setSortBy] = useState('newest');

    const handleSearch = (e) => {
        e.preventDefault();

        onSearch(searchType, query, currentPlatforms, sortBy);
    };

    const handlePlatformToggle = (value) => {
        setPlatforms(value);
    };

    return (
        <div className="space-y-4 relative">
            <ToggleGroup type="single" value={searchType} onValueChange={(value) => setSearchType(value)}>
                <ToggleGroupItem value="name" aria-label="Search by name">
                    Name
                </ToggleGroupItem>
                <ToggleGroupItem value="description" aria-label="Search by description">
                    Description
                </ToggleGroupItem>
                <ToggleGroupItem value="author" aria-label="Search by author">
                    Author ID
                </ToggleGroupItem>
                <ToggleGroupItem disabled value="ai" aria-label="AI Search" className="relative">
                    <Sparkles className="mr-2 h-4 w-4"/>
                    AI Search
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1 rounded">Soon</span>
                </ToggleGroupItem>
            </ToggleGroup>

            {searchType === 'ai' && (
                <p className="text-sm text-muted-foreground text-center">
                    Describe what you're looking for in natural language. For example: "cute anime girl avatars with cat ears" or "robot avatars with neon effects"
                </p>
            )}

            <p className="text-sm text-gray-500 mb-2 text-center">Select platforms (leaving empty will show all avatars):</p>
            <ToggleGroup type="multiple" value={currentPlatforms} onValueChange={handlePlatformToggle}>
                <ToggleGroupItem value="pc" aria-label="PC">
                    <Monitor className="mr-2 h-4 w-4"/>
                    PC
                </ToggleGroupItem>
                <ToggleGroupItem value="android" aria-label="Android">
                    <Smartphone className="mr-2 h-4 w-4"/>
                    Android
                </ToggleGroupItem>
                <ToggleGroupItem value="ios" aria-label="iOS">
                    <Smartphone className="mr-2 h-4 w-4"/>
                    iOS
                </ToggleGroupItem>
            </ToggleGroup>
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input 
                    type="text" 
                    placeholder={`Search avatars by ${searchType}...`} 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    className="flex-grow"
                />

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                </Select>

                <Button type="submit">
                    <Search className="mr-2 h-4 w-4"/> Search
                </Button>
            </form>
        </div>
    );
};