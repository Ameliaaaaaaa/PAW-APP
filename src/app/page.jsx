'use client';

import { getCurrentWindow } from '@tauri-apps/api/window';

import AvatarGrid from '@/components/avatar-grid';

export default function Home() {
    return (
        <div>
            <UpdateTitle />

            <h1 className="text-4xl font-bold mb-8 text-center">VRChat Avatar Search</h1>
            <p className="text-center mb-8">Use the toggle to switch between searching by avatar name, description or author ID.</p>

            <AvatarGrid />
        </div>
    );
};

function UpdateTitle() {
    try {
        getCurrentWindow().setTitle('PAW ~ Search Avatars');
    } catch (error) {};

    return null;
};