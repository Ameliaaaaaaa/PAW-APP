'use client';

import { Star, PersonStanding, Calendar, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SimilarAvatarsGraph from '@/components/similar-avatars-graph';
import AvatarInfoDialog from '@/components/avatar-info-dialogue';
import { RefreshDialog } from '@/components/refresh-dialogue';
import { useDatabase } from '@/context/database-context';
import { Separator } from '@/components/ui/separator';
import { useVRChat } from '@/context/vrchat-context';
import { Button } from '@/components/ui/button';
import { usePAW } from '@/context/paw-context';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const ratings = {
    0: {
        name: 'None',
        image: '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle-question" class="svg-inline--fa fa-circle-question css-1efeorg e9fqopp0" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM169.8 165.3c7.9-22.3 29.1-37.3 52.8-37.3l58.3 0c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24l0-13.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1l-58.3 0c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"></path></svg>'
    },
    1: {
        name: 'Excellent',
        image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g fill-rule="evenodd"><path fill="#6ae854" d="M509.987 256c0 140.267-113.72 254-254 254S1.987 396.267 1.987 256 115.72 2 255.987 2s254 113.733 254 254"/><path fill="#474747" d="m259.727 98.9 46.545 94.308c.584 1.184 1.713 2.002 3.019 2.192l104.098 15.126c3.292.476 4.605 4.52 2.224 6.84l-75.323 73.423c-.942.917-1.377 2.244-1.151 3.547l17.784 103.635c.562 3.277-2.876 5.776-5.82 4.228l-93.09-48.945a4.02 4.02 0 0 0-3.734 0l-93.09 48.945c-2.947 1.548-6.382-.951-5.82-4.228l17.784-103.635c.226-1.303-.21-2.63-1.151-3.547L96.68 217.366c-2.38-2.32-1.066-6.364 2.224-6.84l104.097-15.126a4.022 4.022 0 0 0 3.019-2.192l46.545-94.308c1.47-2.98 5.724-2.98 7.194 0"/></g></svg>'
    },
    2: {
        name: 'Good',
        image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" d="M-96.386-96.386h704.772v704.772H-96.386Z"/><clipPath id="a"><path d="M-96.386-96.386h704.772v704.772H-96.386Z" clip-rule="evenodd"/></clipPath><g clip-path="url(#a)"><path fill="#474747" d="M495.203 256c0 132.107-107.096 239.203-239.203 239.203S16.797 388.107 16.797 256 123.893 16.797 256 16.797 495.203 123.893 495.203 256"/><path fill="none" stroke="#6ae854" stroke-width="33.03" d="M256 16.797c-132.107 0-239.203 107.096-239.203 239.203S123.893 495.203 256 495.203 495.203 388.107 495.203 256 388.107 16.797 256 16.797Z"/><path fill="#6ae854" d="M316.706 256c0 33.526-27.18 60.706-60.706 60.706S195.294 289.526 195.294 256s27.18-60.706 60.706-60.706 60.706 27.18 60.706 60.706"/><path fill="none" stroke="#474747" stroke-width="33.03" d="M256 195.294c-33.526 0-60.706 27.18-60.706 60.706s27.18 60.706 60.706 60.706 60.706-27.18 60.706-60.706-27.18-60.706-60.706-60.706Z"/></g></svg>'
    },
    3: {
        name: 'Medium',
        image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" d="M-96.386-96.386h704.772v704.772H-96.386Z"/><clipPath id="a"><path d="M-96.386-96.386h704.772v704.772H-96.386Z" clip-rule="evenodd"/></clipPath><g clip-path="url(#a)"><path fill="#474747" d="M495.203 256c0 132.107-107.096 239.203-239.203 239.203S16.797 388.107 16.797 256 123.893 16.797 256 16.797 495.203 123.893 495.203 256"/><path fill="none" stroke="#eaaa09" stroke-width="33.03" d="M256 16.797c-132.107 0-239.203 107.096-239.203 239.203S123.893 495.203 256 495.203 495.203 388.107 495.203 256 388.107 16.797 256 16.797Z"/><path fill="#eaaa09" d="M383.562 256c0 70.45-57.112 127.562-127.562 127.562S128.438 326.45 128.438 256 185.55 128.438 256 128.438 383.562 185.55 383.562 256"/><path fill="none" stroke="#474747" stroke-width="33.03" d="M256 128.438c-70.45 0-127.562 57.112-127.562 127.562S185.55 383.562 256 383.562 383.562 326.45 383.562 256 326.45 128.438 256 128.438Z"/></g></svg>'
    },
    4: {
        name: 'Poor',
        image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" d="M-96.386-96.386h704.772v704.772H-96.386Z"/><clipPath id="a"><path d="M-96.386-96.386h704.772v704.772H-96.386Z" clip-rule="evenodd"/></clipPath><g clip-path="url(#a)"><path fill="#474747" d="M495.203 256c0 132.107-107.096 239.203-239.203 239.203S16.797 388.107 16.797 256 123.893 16.797 256 16.797 495.203 123.893 495.203 256"/><path fill="none" stroke="#e55a42" stroke-width="33.03" d="M256 16.797c-132.107 0-239.203 107.096-239.203 239.203S123.893 495.203 256 495.203 495.203 388.107 495.203 256 388.107 16.797 256 16.797Z"/><path fill="#e55a42" d="M435.88 256c0 99.25-80.532 179.778-179.778 179.778-99.25 0-179.782-80.527-179.782-179.778 0-99.25 80.532-179.782 179.782-179.782 99.246 0 179.778 80.532 179.778 179.782"/><path fill="none" stroke="#474747" stroke-width="33.03" d="M256 76.418c-99.25 0-179.78 80.532-179.78 179.782S156.75 435.978 256 435.978 435.78 355.45 435.78 256 355.25 76.418 256 76.418Z"/></g></svg>'
    },
    5: {
        name: 'Very Poor',
        image: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" d="M-96.386-96.386h704.772v704.772H-96.386Z"/><clipPath id="a"><path d="M-96.386-96.386h704.772v704.772H-96.386Z" clip-rule="evenodd"/></clipPath><g clip-path="url(#a)"><path fill="#474747" d="M495.203 256c0 132.107-107.096 239.203-239.203 239.203S16.797 388.107 16.797 256 123.893 16.797 256 16.797 495.203 123.893 495.203 256"/><path fill="none" stroke="#e55a42" stroke-width="33.03" d="M256 16.797c-132.107 0-239.203 107.096-239.203 239.203S123.893 495.203 256 495.203 495.203 388.107 495.203 256 388.107 16.797 256 16.797Z"/><path fill="#e55a42" d="M470.266 256c0 118.338-95.928 214.266-214.266 214.266-118.341 0-214.27-95.928-214.27-214.266 0-118.341 95.93-214.27 214.27-214.27 118.338 0 214.266 95.93 214.266 214.27"/><path fill="none" stroke="#474747" stroke-width="33.03" d="M256 41.847c-118.338 0-214.267 95.93-214.267 214.27 0 118.338 95.93 214.266 214.267 214.266 118.338 0 214.267-95.928 214.267-214.266 0-118.341-95.93-214.27-214.267-214.27Z"/><path fill="#474747" d="M256 320.12c-18.37 0-33.264-14.892-33.264-33.264v-160.43c0-18.37 14.893-33.267 33.264-33.267s33.264 14.896 33.264 33.267v160.43c0 18.372-14.893 33.264-33.264 33.264M287.392 378.688c0 17.287-14.016 31.303-31.303 31.303s-31.303-14.016-31.303-31.303 14.016-31.303 31.303-31.303 31.303 14.016 31.303 31.303"/></g></svg>'
    }
};

const PerformanceRating = ({ rating, platform }) => {
    const ratingValue = rating !== null ? rating : 0;
    const ratingData = ratings[ratingValue];
  
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md">
                        <div className="w-4 h-4" dangerouslySetInnerHTML={{ __html: ratingData.image }} />
                        <span className="text-xs font-medium">{platform}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-medium">
                        {platform} Performance: {ratingData.name}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default function AvatarCard({ avatar, fromGraph = false }) {
    const [isRefreshDialogOpen, setIsRefreshDialogOpen] = useState(false);
    const [isFavoriteDialogOpen, setIsFavoriteDialogOpen] = useState(false);
    const [isSimilarGraphOpen, setIsSimilarGraphOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteEntries, setFavoriteEntries] = useState([]);
    const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

    const { currentUser, switchAvatar } = useVRChat();
    const { getCategories, checkFavorite, favoriteAvatar, removeFromFavorites } = useDatabase();
    const { findSimilar } = usePAW();

    const loadCategories = async () => {
        const categories = await getCategories();

        setCategories(categories);

        if (categories.length > 0) setSelectedCategoryId(categories[0].id);
    };

    const checkIfFavorite = async () => {
        const result = await checkFavorite(avatar.id);

        setFavoriteEntries(result);
        setIsFavorite(result.length > 0);
    };

    useEffect(() => {
        loadCategories();
        checkIfFavorite();
    }, [avatar.id]);

    const addToFavorites = async (categoryId) => {
        if (!categoryId) {
            toast.error('Please select a category.');

            return;
        }

        const favorited = await favoriteAvatar(categoryId, avatar.id, JSON.stringify(avatar));

        if (favorited.exists) {
            toast.warning('Avatar is already in this category.');
            setIsFavoriteDialogOpen(false);

            return;
        }

        if (favorited.success) {
            setIsFavoriteDialogOpen(false);
            await checkIfFavorite();
            toast.success('Added to favorites.');
        }
    };

    const unfavoriteAvatar = async () => {
        await removeFromFavorites(avatar.id);
        setIsFavoriteDialogOpen(false);
        setIsFavorite(false);
        setFavoriteEntries([]);
        toast.success('Removed from favorites.');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const equipAvatar = async () => {
        try {
            const response = await switchAvatar(avatar.id);

            response.success ? toast.success('Avatar selected successfully.') : toast.error('Failed to select avatar.');
        } catch (e) {
            toast.error('Failed to select avatar.');
        }
    };

    const fetchSimilarAvatars = async (avatarId) => {
        try {
            const response = await findSimilar(avatarId);

            if (!response.success) return toast.error('Failed to fetch similar avatars.');

            const results = response.data.results || [];

            return results.map((avatar, index) => ({
                avatar: avatar
            }));
        } catch (e) {
            toast.error('Failed to fetch similar avatars.');
        }
    };

    const openSimilarGraph = () => {
        setIsSimilarGraphOpen(true);
    };

    return (
        <Card className="h-full overflow-hidden bg-card">
            <div className="relative aspect-video">
                <img
                    src={avatar.thumbnail_url}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-3 space-y-2">
                <h3 className="font-medium text-sm line-clamp-1">{avatar.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{avatar.description}</p>
                <p className="text-sm text-gray-500 mb-2">Author ID: {avatar.author_id}</p>
                {
                    (avatar.author_name) &&
                    <p className="text-sm text-gray-500 mb-2">Author Name: {avatar.author_name}</p>
                }
                <div className="flex items-center mb-2 space-x-4">
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1"/>
                        <span className="text-sm">Created: {formatDate(avatar.created_at)}</span>
                    </div>
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1"/>
                        <span className="text-sm">Updated: {formatDate(avatar.updated_at)}</span>
                    </div>
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1"/>
                        <span className="text-sm">Checked: {formatDate(avatar.checked_at)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1">
                    {avatar.pc_compatible ? (
                        <Badge style={{ backgroundColor: '#008000', color: 'white' }} className="text-xs">
                            PC
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="text-xs">
                            PC
                        </Badge>
                    )}
                    {avatar.quest_compatible ? (
                        <Badge style={{ backgroundColor: '#008000', color: 'white' }} className="text-xs">
                            Quest
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="text-xs">
                            Quest
                        </Badge>
                    )}
                    {avatar.ios_compatible ? (
                        <Badge style={{ backgroundColor: '#008000', color: 'white' }} className="text-xs">
                            iOS
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="text-xs">
                            iOS
                        </Badge>
                    )}
                    {avatar.pc_imposter && avatar.quest_imposter && avatar.ios_imposter ? (
                        <Badge style={{ backgroundColor: '#008000', color: 'white' }} className="text-xs">
                            Imposters
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="text-xs">
                            Imposters
                        </Badge>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <PerformanceRating rating={avatar.pc_rating} platform="PC" />
                    <PerformanceRating rating={avatar.quest_rating} platform="Quest" />
                    <PerformanceRating rating={avatar.ios_rating} platform="iOS" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        {isFavorite ? (
                            <Button onClick={() => setIsFavoriteDialogOpen(true)} className="h-8" size="icon">
                                <Star fill="gold" strokeWidth={1} />
                            </Button>
                        ) : (
                            <Button onClick={() => setIsFavoriteDialogOpen(true)} className="h-8" size="icon">
                                <Star />
                            </Button>
                        )}
                        <Button disabled={currentUser === null} onClick={equipAvatar} className="flex-1 h-8 text-xs" size="sm">
                            <PersonStanding className="ml-1 h-3 w-3"/>{currentUser ? 'Select Avatar' : 'Please Log In'}
                        </Button>
                    </div>
                    <Button onClick={() => setIsRefreshDialogOpen(true)} variant="secondary" className="w-full h-8 text-xs" size="sm">
                        Request Refresh
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={() => setIsInfoDialogOpen(true)} variant="secondary" className="w-full h-8 text-xs" size="sm">
                            More Info
                        </Button>
                        <Button disabled={fromGraph} onClick={openSimilarGraph} variant="secondary" className="flex-1 h-8 text-xs" size="sm">
                            Find Similar
                        </Button>
                    </div>
                </div>
            </div>
            <RefreshDialog avatarId={avatar.id} isOpen={isRefreshDialogOpen} onClose={() => setIsRefreshDialogOpen(false)}/>
            <Dialog open={isFavoriteDialogOpen} onOpenChange={setIsFavoriteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isFavorite ? 'Manage Favorite' : 'Add to Favorites'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {categories.length === 0 ? (
                            <div className="text-center space-y-4">
                                <p className="text-muted-foreground">No categories found. Please create a category first.</p>
                                <Button onClick={() => {
                                    setIsFavoriteDialogOpen(false)
                                    window.location.href = "/favourites"
                                }}>
                                    Create Category
                                </Button>
                            </div>
                        ) : (
                        <div className="space-y-4">
                            {isFavorite ? (
                                <div className="space-y-2">
                                    <p>This avatar is in your favorites. You can:</p>
                                    <Button variant="destructive" className="w-full" onClick={unfavoriteAvatar}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove from all categories
                                    </Button>
                                    <Separator className="my-4" />
                                    <p>Or add to another category:</p>
                                </div>
                            ) : (
                                <p>Select a category to add this avatar to:</p>
                            )}
                            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                                {categories.map((category) => (
                                    <div key={category.id} className="p-2 border rounded-md cursor-pointer hover:bg-muted" onClick={() => {
                                        setSelectedCategoryId(category.id)
                                        addToFavorites(category.id)
                                    }}>
                                        {category.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                </DialogContent>
            </Dialog>
            
            <AvatarInfoDialog avatarId={avatar.id} isOpen={isInfoDialogOpen} onClose={() => setIsInfoDialogOpen(false)} />

            <SimilarAvatarsGraph isOpen={isSimilarGraphOpen} onClose={() => setIsSimilarGraphOpen(false)} avatar={avatar} onFetchSimilar={fetchSimilarAvatars}/>
        </Card>
    );
};