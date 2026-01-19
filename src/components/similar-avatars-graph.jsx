'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { useLanguage } from '@/context/language-provider-context';
import AvatarCard from '@/components/avatar-card';

const SimilarAvatarsGraph = ({ isOpen, onClose, avatar, onFetchSimilar }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [dimensions] = useState({ width: 900, height: 600 });
    const [loadingMore, setLoadingMore] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const animationRef = useRef(null);
    const processedAvatarsRef = useRef(new Set());
    const canvasRef = useRef(null);

    const { theme } = useTheme();
    const { lang, t } = useLanguage();

    const getThemeColors = () => {
        const root = document.documentElement;
        const style = getComputedStyle(root);

        const getHSL = (varName) => {
            const value = style.getPropertyValue(varName).trim();

            return `hsl(${value})`;
        };

        return {
            background: getHSL('--background'),
            foreground: getHSL('--foreground'),
            primary: getHSL('--primary'),
            secondary: getHSL('--secondary'),
            muted: getHSL('--muted'),
            border: getHSL('--border'),
            card: getHSL('--card'),
            accent: getHSL('--accent')
        };
    };

    useEffect(() => {
        if (!isOpen) return;

        const preventScroll = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });
        document.addEventListener('wheel', preventScroll, { passive: false });
        document.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            window.removeEventListener('wheel', preventScroll);
            window.removeEventListener('touchmove', preventScroll);
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('touchmove', preventScroll);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;

            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        } else {
            const scrollY = document.body.style.top;

            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';

            if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !avatar) return;

        processedAvatarsRef.current = new Set([avatar.id]);

        const img = new Image();

        img.src = avatar.thumbnail_url.replace('https://paw-api.amelia.fun/proxy?url=', '');

        const mainNode = {
            id: avatar.id,
            label: avatar.name,
            x: dimensions.width / 2,
            y: dimensions.height / 2,
            vx: 0,
            vy: 0,
            avatar: avatar,
            image: img,
            isMain: true,
            depth: 0
        };

        setNodes([mainNode]);
        setEdges([]);
        setSelectedNode(mainNode);

        fetchSimilarAvatars(avatar.id, mainNode);
    }, [isOpen, avatar?.id]);

    const fetchSimilarAvatars = async (avatarId, sourceNode) => {
        setLoadingMore(true);

        try {
            const similarAvatars = await onFetchSimilar(avatarId);

            if (!similarAvatars || similarAvatars.length === 0) {
                toast.info(lang.SimilarAvatars.SimilarAvatarsNotFound);
                setLoadingMore(false);
                return;
            }

            const newAvatars = similarAvatars.filter(similar => !processedAvatarsRef.current.has(similar.avatar.id));

            if (newAvatars.length === 0) {
                toast.info(lang.SimilarAvatars.NewSimilarAvatarsNotFound);
                setLoadingMore(false);
                return;
            }

            newAvatars.forEach(similar => {
                processedAvatarsRef.current.add(similar.avatar.id);
            });

            const newNodes = newAvatars.map((similar, index) => {
                const totalNew = newAvatars.length;
                const angle = (index / totalNew) * 2 * Math.PI;
                const radius = 180;

                const img = new Image();

                img.src = similar.avatar.thumbnail_url.replace('https://paw-api.amelia.fun/proxy?url=', '');

                return {
                    id: similar.avatar.id,
                    label: similar.avatar.name,
                    x: sourceNode.x + Math.cos(angle) * radius,
                    y: sourceNode.y + Math.sin(angle) * radius,
                    vx: 0,
                    vy: 0,
                    avatar: similar.avatar,
                    image: img,
                    isMain: false,
                    depth: sourceNode.depth + 1
                };
            });

            const newEdges = newAvatars.map(similar => ({
                from: sourceNode.id,
                to: similar.avatar.id
            }));

            setNodes(prev => [...prev, ...newNodes]);
            setEdges(prev => [...prev, ...newEdges]);

            toast.success(t('SimilarAvatars.AddedSimilarAvatars', lang, { count: newNodes.length }));
        } catch (error) {
            toast.error(lang.SimilarAvatars.SimilarAvatarsLoadingFailed);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!isOpen || nodes.length === 0) return;

        const simulate = () => {
            setNodes(prevNodes => {
                const newNodes = prevNodes.map(node => ({ ...node }));

                newNodes.forEach((node, i) => {
                    let fx = 0, fy = 0;

                    newNodes.forEach((other, j) => {
                        if (i !== j) {
                            const dx = node.x - other.x;
                            const dy = node.y - other.y;
                            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                            const force = 4000 / (dist * dist);

                            fx += (dx / dist) * force;
                            fy += (dy / dist) * force;
                        }
                    });

                    edges.forEach(edge => {
                        let other = null;
                        let attraction = 0.0015;

                        if (edge.from === node.id) {
                            other = newNodes.find(n => n.id === edge.to);
                        } else if (edge.to === node.id) {
                            other = newNodes.find(n => n.id === edge.from);
                        }

                        if (other) {
                            const dx = other.x - node.x;
                            const dy = other.y - node.y;

                            fx += dx * attraction;
                            fy += dy * attraction;
                        }
                    });

                    const centerX = dimensions.width / 2;
                    const centerY = dimensions.height / 2;
                    const centerForce = node.depth === 0 ? 0.001 : node.depth === 1 ? 0.0003 : 0.0001;

                    fx += (centerX - node.x) * centerForce;
                    fy += (centerY - node.y) * centerForce;

                    node.vx = (node.vx + fx) * 0.85;
                    node.vy = (node.vy + fy) * 0.85;

                    node.x += node.vx;
                    node.y += node.vy;
                });

                return newNodes;
            });

            animationRef.current = requestAnimationFrame(simulate);
        };

        animationRef.current = requestAnimationFrame(simulate);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isOpen, nodes.length, edges, dimensions]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas || nodes.length === 0) return;

        const ctx = canvas.getContext('2d');
        const colors = getThemeColors();

        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        ctx.fillStyle = colors.background;

        ctx.fillRect(0, 0, dimensions.width, dimensions.height);

        ctx.save();
        ctx.translate(pan.x, pan.y);

        edges.forEach(edge => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);

            if (!fromNode || !toNode) return;

            const isHighlighted = selectedNode && (selectedNode.id === edge.from || selectedNode.id === edge.to);

            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);

            ctx.strokeStyle = isHighlighted ? colors.primary : colors.border;
            ctx.lineWidth = isHighlighted ? 3 : 2;

            ctx.stroke();

            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
            const headLen = 12;
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ratio = (dist - 40) / dist;
            const arrowX = fromNode.x + dx * ratio;
            const arrowY = fromNode.y + dy * ratio;

            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - headLen * Math.cos(angle - Math.PI / 6), arrowY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - headLen * Math.cos(angle + Math.PI / 6), arrowY - headLen * Math.sin(angle + Math.PI / 6));

            ctx.strokeStyle = isHighlighted ? colors.primary : colors.muted;
            ctx.lineWidth = isHighlighted ? 2 : 1.5;

            ctx.stroke();
        });

        nodes.forEach(node => {
            const isSelected = selectedNode && selectedNode.id === node.id;
            const nodeRadius = node.depth === 0 ? 35 : 30;

            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();

            if (node.image && node.image.complete && node.image.naturalHeight !== 0) {
                ctx.drawImage(node.image, node.x - nodeRadius, node.y - nodeRadius, nodeRadius * 2, nodeRadius * 2);
            } else {
                node.depth === 0 ? ctx.fillStyle = colors.accent : ctx.fillStyle = colors.card;

                ctx.fill();
            }

            ctx.restore();

            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);

            ctx.strokeStyle = node.depth === 0 ? colors.primary : colors.border;
            ctx.lineWidth = isSelected ? 4 : node.depth === 0 ? 3 : 2;

            ctx.stroke();

            if (isSelected) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeRadius + 6, 0, 2 * Math.PI);

                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 2;

                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.fillStyle = colors.foreground;
            ctx.font = node.depth === 0 ? 'bold 13px sans-serif' : '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const maxWidth = 100;
            const label = node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label;

            ctx.fillText(label, node.x, node.y + nodeRadius + 5, maxWidth);
        });

        ctx.restore();
    }, [nodes, edges, selectedNode, dimensions, theme, pan]);

    const handleCanvasClick = (e) => {
        if (isPanning) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x);
        const y = (e.clientY - rect.top - pan.y);

        const clickedNode = nodes.find(node => {
            const dx = x - node.x;
            const dy = y - node.y;
            const nodeRadius = node.depth === 0 ? 35 : 30;

            return Math.sqrt(dx * dx + dy * dy) < nodeRadius;
        });

        if (clickedNode) {
            setSelectedNode(clickedNode);
            fetchSimilarAvatars(clickedNode.id, clickedNode);
        }
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isPanning) return;

        e.preventDefault();
        e.stopPropagation();

        setPan({
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y
        });
    };

    const handleMouseUp = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setIsPanning(false);
    };

    const handleClose = () => {
        processedAvatarsRef.current = new Set();

        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setPan({ x: 0, y: 0 });
        setIsPanning(false);
        onClose();
    };

    const colors = getThemeColors();

    return (
        <div
            className={`fixed inset-0 z-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center bg-background/80 backdrop-blur-sm`}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
        >
            <div className="bg-card border border-border rounded-lg shadow-lg max-w-[95vw] max-h-[95vh] overflow-hidden">
                <div className="p-6 pb-0">
                    <h2 className="text-2xl font-bold text-foreground">{lang.SimilarAvatars.Header}</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        {lang.SimilarAvatars.Description}
                    </p>
                </div>

                <div className="flex gap-6 p-6 overflow-hidden">
                    <div className="relative flex-shrink-0">
                        <canvas
                            ref={canvasRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            onClick={handleCanvasClick}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="border-2 rounded-xl"
                            style={{
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                cursor: isPanning ? 'grabbing' : 'grab'
                            }}
                        />
                        {loadingMore && (
                            <div className="absolute top-4 right-4 bg-card border border-border rounded-lg shadow-lg p-3 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" style={{ color: colors.primary }} />
                                <span className="text-sm font-medium text-foreground">{lang.SimilarAvatars.LoadingSimilarAvatars}</span>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg shadow-lg p-3">
                            <p className="text-xs font-medium text-foreground">
                                {t('SimilarAvatars.Results', lang, { nodes: nodes.length, s: nodes.length !== 1 ? 's' : '', edges: edges.length, ss: edges.length !== 1 ? 's' : '' })}
                            </p>
                        </div>
                    </div>

                    <div className="w-80 flex-shrink-0 overflow-y-auto">
                        {selectedNode ? (
                            <div className="space-y-2">
                                <AvatarCard avatar={selectedNode.avatar} fromGraph={true}/>
                            </div>
                        ) : (
                            <div
                                className="bg-muted/50 rounded-xl p-6 border-2 border-dashed border-border h-full flex items-center justify-center">
                                <p className="text-muted-foreground text-center text-sm">
                                    {lang.SimilarAvatars.ClickNode}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 flex justify-end">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                    >
                        {lang.SimilarAvatars.Close}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimilarAvatarsGraph;