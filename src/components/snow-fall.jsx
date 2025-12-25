'use client';

import { useEffect, useRef } from 'react';

export default function Snowfall() {
    const canvasRef = useRef(null);
    const snowflakesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        const snowflakeCount = 150;

        if (!snowflakesRef.current.length) for (let i = 0; i < snowflakeCount; i++) {
            snowflakesRef.current.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 3 + 1,
                speed: Math.random() + 0.5
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = 'white';

            ctx.beginPath();

            snowflakesRef.current.forEach(f => {
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            });

            ctx.fill();
            update();
        };

        const update = () => {
            snowflakesRef.current.forEach(f => {
                f.y += f.speed;

                if (f.y > height) {
                    f.y = 0;
                    f.x = Math.random() * width;
                }
            });
        };

        let animationId;

        const animate = () => {
            draw();

            animationId = requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            snowflakesRef.current.forEach(f => { f.x = Math.random() * width; f.y = Math.random() * height });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
            style={{ display: "block" }}
        />
    );
};