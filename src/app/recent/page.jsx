'use client';

import RecentAvatarsGrid from '@/components/recent-avatar-grid';

export default function RecentPage() {
  return (
    <div>
      <UpdateTitle />
      <h1 className="text-4xl font-bold mb-8 text-center">VRChat Avatar Search</h1>
      <p className="text-center mb-8">Recently seen avatars (This only works when avatars are unloaded from VRAM)</p>
      <RecentAvatarsGrid />
    </div>
  );
};

const UpdateTitle = () => {
  try {
    if (typeof window === 'undefined') return null;
    
    import('@tauri-apps/api/window').then((tauri) => {
      tauri.getCurrentWindow().setTitle('PAW ~ Recently Seen Avatars');
    });
  } catch (error) {};
  
  return null;
};