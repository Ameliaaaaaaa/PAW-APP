'use client';

export default function Favourites() {
    return (
        <div>
            <UpdateTitle/>
            WIP
        </div>
    );
};

function UpdateTitle() {
    try {
        getCurrentWindow().setTitle('PAW ~ Favourites');
    } catch (error) {};

    return null;
};