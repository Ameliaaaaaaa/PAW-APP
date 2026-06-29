'use client';

import { Search, Monitor, Smartphone, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const RATING_OPTIONS = ['None', 'Excellent', 'Good', 'Medium', 'Poor', 'VeryPoor'] as const;

const RATING_PLATFORMS = [
    { key: 'pc', label: 'PC' },
    { key: 'quest', label: 'Quest' },
    { key: 'ios', label: 'iOS' }
] as const;

type RatingPlatform = typeof RATING_PLATFORMS[number]['key'];

type RatingState = {
    value: string;
    modifier: 'exact' | '+';
};

export default function SearchInput({ onSearch }: { onSearch: any }): JSX.Element {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState('name');
    const [currentPlatforms, setPlatforms] = useState([]);
    const [sortBy, setSortBy] = useState('newest');

    const [ratings, setRatings] = useState<Record<RatingPlatform, RatingState>>({
        pc: { value: 'None', modifier: 'exact' },
        quest: { value: 'None', modifier: 'exact' },
        ios: { value: 'None', modifier: 'exact' }
    });

    const handleSearch: any = (e: any): void => {
        e.preventDefault();

        const ratingParams: Record<string, string> = {};

        for (const { key } of RATING_PLATFORMS) {
            const { value, modifier } = ratings[key];

            if (value !== 'None') ratingParams[`${key}_rating`] = `${value}${modifier === 'exact' ? '' : '+'}`;
        }

        onSearch(searchType, query, currentPlatforms, sortBy, ratingParams);
    };

    const setRatingField: any = (platform: RatingPlatform, field: keyof RatingState, val: string): void => {
        setRatings((prev: any): any => ({ ...prev, [platform]: { ...prev[platform], [field]: val } }));
    };

    return (
        <div className="space-y-4 relative">
            <ToggleGroup type="single" value={searchType} onValueChange={(value: any): void => setSearchType(value)}>
                <ToggleGroupItem value="name">Name</ToggleGroupItem>
                <ToggleGroupItem value="description">Description</ToggleGroupItem>
                <ToggleGroupItem value="author">Author ID</ToggleGroupItem>
                <ToggleGroupItem value="author_name">Author Name</ToggleGroupItem>
                <ToggleGroupItem value="ai_tags">
                    <Sparkles className="mr-2 h-4 w-4" /> AI
                </ToggleGroupItem>
            </ToggleGroup>

            {searchType === 'ai_tags' && (
                <p className="text-sm text-muted-foreground text-center">
                    Describe what you are looking for and the AI will return results that match.
                </p>
            )}

            <p className="text-sm text-gray-500 mb-2 text-center">Select platforms (leaving empty will show all avatars):</p>
            <ToggleGroup type="multiple" value={currentPlatforms} onValueChange={setPlatforms}>
                <ToggleGroupItem value="pc"><Monitor className="mr-2 h-4 w-4" /> PC</ToggleGroupItem>
                <ToggleGroupItem value="android"><Smartphone className="mr-2 h-4 w-4" /> Android</ToggleGroupItem>
                <ToggleGroupItem value="ios"><Smartphone className="mr-2 h-4 w-4" /> iOS</ToggleGroupItem>
            </ToggleGroup>

            <div className="space-y-2">
                <p className="text-sm text-gray-500 text-center">Performance rating filters (optional):</p>
                <div className="flex flex-wrap gap-3 justify-center">
                    {RATING_PLATFORMS.map(({ key, label }: any): JSX.Element => (
                        <div key={key} className="flex items-center gap-2">
                            <span className="text-sm font-medium w-10">{label}</span>
                            <Select value={ratings[key].value} onValueChange={(val: string): any => setRatingField(key, 'value', val)}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {RATING_OPTIONS.map((r: any): JSX.Element => (
                                        <SelectItem key={r} value={r}>{r === 'None' ? 'Any' : r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {ratings[key].value !== 'None' && (
                                <Select value={ratings[key].modifier} onValueChange={(val: string): any => setRatingField(key, 'modifier', val as 'exact' | '+')}>
                                    <SelectTrigger className="w-[110px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="exact">Exact</SelectItem>
                                        <SelectItem value="+">Or better</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    type="text"
                    placeholder={`Search avatars by ${searchType}...`}
                    value={query}
                    onChange={(e: any): void => setQuery(e.target.value)}
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
                    <Search className="mr-2 h-4 w-4" /> Search
                </Button>
            </form>
        </div>
    );
}