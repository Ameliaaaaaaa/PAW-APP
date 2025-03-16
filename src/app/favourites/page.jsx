'use client';

import { useDatabase } from '@/context/database-context';

export default function Favourites() {
    return (
        <div>
            Hi
        </div>
    );
};

function UpdateTitle() {
    try {
        getCurrentWindow().setTitle('PAW ~ Favourites');
    } catch (error) {};

    return null;
};