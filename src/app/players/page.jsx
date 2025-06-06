'use client';

import { Loader2, Search, PersonStanding, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useLogScanner } from '@/context/log-scanner-context';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useVRChat } from '@/context/vrchat-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Page() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUserData, setCurrentUserData] = useState(null);

    const refreshTimeoutRef = useRef(null);
    
    const { getUserInfo, switchAvatar } = useVRChat();
    const { getPlayers } = useLogScanner();

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            
            const currentPlayers = getPlayers();
            
            if (!currentPlayers || currentPlayers.length === 0) {
                setUsers([]);
                setFilteredUsers([]);

                return;
            }
            
            const validPlayers = currentPlayers.filter(player => player && player.userId);
            
            const usersWithData = await Promise.all(validPlayers.map(async (player) => {
                return {
                    displayName: player.playerName || 'Unknown User'
                };
            }));
            
            setUsers(usersWithData);
            setFilteredUsers(usersWithData);
        } catch (error) {
            toast('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    }, [getPlayers]);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const currentUser = await getUserInfo();

            if (currentUser) setCurrentUserData(currentUser);
        } catch (error) {
            toast('Failed to fetch current user');
        }
    }, [getUserInfo]);

    useEffect(() => {
        fetchCurrentUser();
        fetchUsers();
        
        refreshTimeoutRef.current = setInterval(() => {
            fetchUsers();
        }, 30000);
        
        return () => {
            if (refreshTimeoutRef.current) clearInterval(refreshTimeoutRef.current);
        };
    }, [fetchUsers, fetchCurrentUser]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredUsers(users);

            return;
        }
        
        const filtered = users.filter(user => user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const handleEquipAvatar = async (userId) => {
        toast('Feature is not yet implemented');
        /* try {
            const userData = await getUserById(userId);
            
            if (!userData || !userData.currentAvatarImageUrl) {
                toast("Couldn't find user's avatar information");
                return;
            }
            
            // Extract avatar ID from the image URL or use a provided property
            const avatarId = userData.currentAvatarId;
            
            if (!avatarId) {
                toast("Couldn't determine the avatar ID");
                return;
            }
            
            // Switch to the avatar
            const response = await switchAvatar(avatarId);
            
            if (response.success) {
                toast(`Successfully equipped ${userData.displayName}'s avatar!`);
            } else {
                toast('Failed to equip avatar');
            }
        } catch (error) {
            err('Error equipping avatar:', error);
            toast('Failed to equip avatar');
        } */
    };

    const handleRefresh = () => {
        fetchUsers();

        toast('User list refreshed');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <UpdateTitle />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Users in Current Instance</h1>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />Refresh
                </Button>
            </div>
            
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                    </div>
                </CardContent>
            </Card>
            
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {users.length === 0 
                            ? "No users found in the current instance. Join a world to see users." 
                            : "No users match your search criteria."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredUsers.map((user, index) => (
                        <Card key={user.userId || index} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {user.userIcon ? (
                                            <img 
                                                src={user.userIcon} 
                                                alt={user.displayName} 
                                                className="h-10 w-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                <PersonStanding className="h-6 w-6" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-medium">{user.displayName}</h3>
                                            <p className="text-xs text-muted-foreground">{user.userId}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => handleEquipAvatar(user.userId)}
                                        disabled={!currentUserData}
                                        className="h-8"
                                        size="sm"
                                    >
                                        <PersonStanding className="mr-2 h-4 w-4" />
                                        Equip Avatar
                                    </Button>
                                </div>
                                
                                {user.statusDescription && (
                                    <>
                                        <Separator className="my-3" />
                                        <p className="text-sm text-muted-foreground">{user.statusDescription}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            
            {!currentUserData && (
                <div className="mt-6 p-4 bg-muted rounded-md">
                    <p className="text-center text-muted-foreground">
                        Please log in to VRChat to equip avatars from other users.
                    </p>
                </div>
            )}
        </div>
    );
};

const UpdateTitle = () => {
    try {
        if (typeof window === 'undefined') return null;
      
        import('@tauri-apps/api/window').then((tauri) => {
            tauri.getCurrentWindow().setTitle('PAW ~ Players');
        });
    } catch (error) {};
    
    return null;
};