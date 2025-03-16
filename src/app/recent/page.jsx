'use client';

import { getCurrentWindow } from '@tauri-apps/api/window';

import RecentAvatarsGrid from '@/components/recent-avatar-grid';

export default function Recent() {
    return (
        <div>
            <UpdateTitle />

            <h1 className="text-4xl font-bold mb-8 text-center">VRChat Avatar Search</h1>
            <p className="text-center mb-8">Recently seen avatars</p>
            
             <RecentAvatarsGrid />
        </div>
    );
};

function UpdateTitle() {
    try {
        getCurrentWindow().setTitle('PAW ~ Recently Seen Avatars');
    } catch (error) {};

    return null;
};