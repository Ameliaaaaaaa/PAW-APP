'use client';

import { Plus, Trash2, Edit, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import AvatarCard from '@/components/AvatarCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Page(): JSX.Element {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const loadCategories: () => Promise<void> = async (): Promise<void> => {
        const categories: any[] = await window.electron.Database.getCategories();

        setCategories(categories);

        if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0]);

        setIsLoading(false);
    };

    const loadFavorites: (categoryId: number) => Promise<void> = async (categoryId: number): Promise<void> => {
        const favorites: any[] = await window.electron.Database.getFavorites(categoryId);

        const withAvatarData: any[] = await Promise.all(favorites.map(async (favorite: any): Promise<any> => {
            const response: any = await window.electron.PAW.fetchAvatar(favorite.avatar_id);

            return {
                ...favorite,
                avatar: response.success ? response.result : null
            };
        }));

        setFavorites(withAvatarData.filter((f: any): boolean => f.avatar !== null));
    };

    useEffect((): void => {
        loadCategories();

        if (selectedCategory) loadFavorites(selectedCategory.id);
    }, [selectedCategory]);

    const makeCategory: () => Promise<void> = async (): Promise<void> => {
        if (!newCategoryName.trim()) {
            toast.error('Category name cannot be empty');

            return;
        }

        await window.electron.Database.createCategory(newCategoryName);
        setNewCategoryName('');
        setIsDialogOpen(false);
        toast.success('Category created successfully');
        await loadCategories();
    };

    const changeCategory: () => Promise<void> = async (): Promise<void> => {
        if (!editingCategory || !editingCategory.name.trim()) {
            toast.error('Category name cannot be empty');

            return;
        }

        await window.electron.Database.updateCategory(editingCategory.id, editingCategory.name);
        setEditingCategory(null);
        toast('Category updated successfully');
        await loadCategories();

        if (selectedCategory && selectedCategory.id === editingCategory.id) setSelectedCategory({
            ...selectedCategory,
            name: editingCategory.name
        });
    };

    const removeCategory: (categoryId: number) => Promise<void> = async (categoryId: number): Promise<void> => {
        await window.electron.Database.deleteCategory(categoryId);
        toast.success('Category deleted successfully');
        await loadCategories()

        if (selectedCategory && selectedCategory.id === categoryId) {
            const updatedCategories: any[] = categories.filter((cat: any): boolean => cat.id !== categoryId);

            setSelectedCategory(updatedCategories.length > 0 ? updatedCategories[0] : null);
        }
    };

    const removeFavorite: (favoriteId: number) => Promise<void> = async (favoriteId: number): Promise<void> => {
        await window.electron.Database.unfavoriteAvatar(favoriteId);
        toast.success('Avatar removed from favorites');

        if (selectedCategory) await loadFavorites(selectedCategory.id);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Favorites</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Category</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input placeholder="Category Name" value={newCategoryName} onChange={(e: any): void => setNewCategoryName(e.target.value)}/>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={(): void => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={makeCategory}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <p>Loading...</p>
                </div>
            ) : categories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <p className="text-muted-foreground mb-4">No categories found</p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Create Your First Category
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Category</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <Input placeholder="Category Name" value={newCategoryName} onChange={(e: any): void => setNewCategoryName(e.target.value)}/>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={(): void => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={makeCategory}>Create</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Categories</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[calc(100vh-300px)]">
                                <div className="space-y-2">
                                    {categories.map((category: any): JSX.Element => (
                                        <div key={category.id} className={`flex items-center justify-between p-2 rounded-md ${
                                            selectedCategory && selectedCategory.id === category.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                        }`}>
                                            {editingCategory && editingCategory.id === category.id ? (
                                                <div className="flex items-center w-full">
                                                    <Input value={editingCategory.name} onChange={(e: any): void => setEditingCategory({ ...editingCategory, name: e.target.value })} className="h-8"/>
                                                    <Button variant="ghost" size="icon" onClick={changeCategory} className="ml-2 h-8 w-8">
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button className="flex-1 text-left" onClick={(): void => setSelectedCategory(category)}>
                                                        {category.name}
                                                    </button>
                                                    <div className="flex items-center">
                                                        <Button variant="ghost" size="icon" onClick={(): void => setEditingCategory(category)} className="h-8 w-8">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={(): Promise<void> => removeCategory(category.id)} className="h-8 w-8 text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-3">
                        {selectedCategory ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{selectedCategory.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {favorites.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64">
                                            <p className="text-muted-foreground mb-4">No avatars in this category</p>
                                            <p className="text-sm text-muted-foreground">
                                                Add avatars to this category by clicking the star icon on avatar cards
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {favorites.map((favorite: any): JSX.Element => (
                                                <div key={favorite.id} className="relative">
                                                    <AvatarCard avatar={favorite.avatar} />
                                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={(): Promise<void> => removeFavorite(favorite.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="flex items-center justify-center h-64">
                                    <p className="text-muted-foreground">Select a category to view favorites</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};