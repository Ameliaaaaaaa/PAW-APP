'use client';

import { useEffect, useRef } from 'react';

export default function Snowfall(): JSX.Element {
    const canvasRef: any = useRef(null);
    const snowflakesRef: any = useRef([]);

    useEffect((): () => void => {
        const canvas: any = canvasRef.current;

        if (!canvas) return;

        const ctx: any = canvas.getContext('2d');

        if (!ctx) return;

        let width: number = window.innerWidth;
        let height: number = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        const snowflakeCount = 150;

        if (!snowflakesRef.current.length) for (let i: number = 0; i < snowflakeCount; i++) {
            snowflakesRef.current.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 3 + 1,
                speed: Math.random() + 0.5
            });
        }

        const draw: () => void = (): void => {
            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = 'white';

            ctx.beginPath();

            snowflakesRef.current.forEach((f: any): void => {
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            });

            ctx.fill();
            update();
        };

        const update: () => void = (): void => {
            snowflakesRef.current.forEach((f: any): void => {
                f.y += f.speed;

                if (f.y > height) {
                    f.y = 0;
                    f.x = Math.random() * width;
                }
            });
        };

        let animationId;

        const animate: () => void = (): void => {
            draw();

            animationId = requestAnimationFrame(animate);
        };

        animate();

        const handleResize: () => void = (): void => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            snowflakesRef.current.forEach((f: any): void => { f.x = Math.random() * width; f.y = Math.random() * height });
        };

        window.addEventListener('resize', handleResize);

        return (): void => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-50" style={{
            display: "block"
        }}/>
    );
};