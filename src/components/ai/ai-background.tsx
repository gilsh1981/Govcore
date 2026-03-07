"use client";

import { useMemo } from "react";

const aiKeyframes = `
@keyframes float1{0%,100%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(18px,-24px) rotate(2.5deg)}}
@keyframes float2{0%,100%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(-14px,20px) rotate(-2deg)}}
@keyframes float3{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,14px)}}
@keyframes waveMove{0%{stroke-dashoffset:0}100%{stroke-dashoffset:-80}}
@keyframes waveMove2{0%{stroke-dashoffset:0}100%{stroke-dashoffset:60}}
@keyframes nodePulse{0%,100%{opacity:0.4}50%{opacity:1}}
@keyframes edgePulse{0%,100%{opacity:0.2}50%{opacity:0.7}}
@keyframes ringPulse{0%,100%{opacity:0.15;transform:rotate(0deg) scale(1)}50%{opacity:0.45;transform:rotate(180deg) scale(1.02)}}
@keyframes ringPulseR{0%,100%{opacity:0.1;transform:rotate(0deg) scale(1)}50%{opacity:0.35;transform:rotate(-180deg) scale(1.01)}}
@keyframes sweepLR{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
@keyframes fadeSlide{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
@keyframes glowBreathe{0%,100%{opacity:0.5}50%{opacity:0.85}}
`;

export function AiKeyframesStyle() {
  return <style dangerouslySetInnerHTML={{ __html: aiKeyframes }} />;
}

interface AiBackgroundProps {
  variant?: "full" | "subtle";
}

export function AiBackground({ variant = "full" }: AiBackgroundProps) {
  const subtle = variant === "subtle";
  const nodeCount = subtle ? 12 : 22;
  const opacityScale = subtle ? 0.4 : 1;

  const nodes = useMemo(
    () =>
      Array.from({ length: nodeCount }, (_, i) => ({
        id: i,
        cx: 3 + ((i * 31 + 11) % 94),
        cy: 3 + ((i * 47 + 5) % 94),
        r: 1.8 + (i % 4) * 0.7,
        delay: i * 0.5,
        bright: i % 5 === 0,
      })),
    [nodeCount],
  );

  const edges = useMemo(() => {
    const e: { id: number; x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const t1 = nodes[(i + 2) % nodes.length];
      const t2 = nodes[(i + 5) % nodes.length];
      e.push({ id: i * 2, x1: nodes[i].cx, y1: nodes[i].cy, x2: t1.cx, y2: t1.cy, delay: i * 0.4 });
      if (i % 2 === 0) {
        e.push({ id: i * 2 + 1, x1: nodes[i].cx, y1: nodes[i].cy, x2: t2.cx, y2: t2.cy, delay: i * 0.6 });
      }
    }
    return e;
  }, [nodes]);

  function o(base: number) {
    return (base * opacityScale).toFixed(2);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(160deg, #06081a 0%, #0a0c1f 30%, #080a18 60%, #04060f 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(800px circle at 50% 38%, rgba(90,70,220,${o(0.50)}) 0%, rgba(60,40,180,${o(0.20)}) 35%, transparent 65%)`,
          animation: "glowBreathe 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(350px circle at 50% 42%, rgba(200,190,255,${o(0.14)}) 0%, transparent 50%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(600px circle at 20% 75%, rgba(50,40,180,${o(0.18)}) 0%, transparent 55%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(500px circle at 80% 20%, rgba(70,50,200,${o(0.12)}) 0%, transparent 50%)`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `linear-gradient(105deg, transparent 40%, rgba(140,120,255,${o(0.06)}) 48%, rgba(180,160,255,${o(0.10)}) 50%, rgba(140,120,255,${o(0.06)}) 52%, transparent 60%)`,
            animation: "sweepLR 12s ease-in-out infinite",
          }}
        />
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor={`rgba(160,140,255,${o(0.9)})`} />
            <stop offset="100%" stopColor="rgba(160,140,255,0)" />
          </radialGradient>
          <radialGradient id="nodeBright">
            <stop offset="0%" stopColor={`rgba(200,190,255,${o(1)})`} />
            <stop offset="50%" stopColor={`rgba(140,120,255,${o(0.5)})`} />
            <stop offset="100%" stopColor="rgba(140,120,255,0)" />
          </radialGradient>
        </defs>
        {edges.map((e) => (
          <line
            key={`e${e.id}`}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={`rgba(130,115,255,${o(0.22)})`}
            strokeWidth="0.12"
            style={{ animation: `edgePulse ${3.5 + e.delay * 0.3}s ease-in-out infinite`, animationDelay: `${e.delay}s` }}
          />
        ))}
        {nodes.map((n) => (
          <g key={`n${n.id}`}>
            <circle cx={n.cx} cy={n.cy} r={n.r * 3}
              fill={n.bright ? "url(#nodeBright)" : "url(#nodeGlow)"}
              style={{ animation: `nodePulse ${2.5 + n.delay * 0.25}s ease-in-out infinite`, animationDelay: `${n.delay}s` }}
            />
            <circle cx={n.cx} cy={n.cy} r={n.bright ? n.r * 1.3 : n.r}
              fill={n.bright ? `rgba(210,200,255,${o(0.95)})` : `rgba(170,155,255,${o(0.75)})`}
              style={{ animation: `nodePulse ${2.5 + n.delay * 0.25}s ease-in-out infinite`, animationDelay: `${n.delay}s` }}
            />
          </g>
        ))}
        {!subtle && (
          <>
            <g style={{ animation: "float3 18s ease-in-out infinite" }}>
              <path d="M-5 72 Q5 67, 15 72 T35 72 T55 72 T75 72 T95 72 T110 72" fill="none"
                stroke="rgba(150,135,255,0.40)" strokeWidth="0.25" strokeDasharray="1.5 1"
                style={{ animation: "waveMove 6s linear infinite" }} />
              <path d="M-5 74 Q8 69, 20 74 T44 74 T68 74 T92 74 T110 74" fill="none"
                stroke="rgba(130,115,255,0.30)" strokeWidth="0.2" strokeDasharray="2 1.5"
                style={{ animation: "waveMove 9s linear infinite" }} />
              <path d="M-5 76 Q10 72, 22 76 T48 76 T74 76 T100 76" fill="none"
                stroke="rgba(170,155,255,0.22)" strokeWidth="0.18" strokeDasharray="2.5 2"
                style={{ animation: "waveMove2 7s linear infinite" }} />
            </g>
            <g style={{ animation: "float2 22s ease-in-out infinite" }}>
              <path d="M-5 22 Q10 18, 25 22 T55 22 T85 22 T110 22" fill="none"
                stroke="rgba(140,125,255,0.20)" strokeWidth="0.15" strokeDasharray="2 2"
                style={{ animation: "waveMove 10s linear infinite" }} />
            </g>
            <g style={{ animation: "float1 20s ease-in-out infinite" }}>
              <rect x="8" y="14" width="11" height="14" rx="1" fill="rgba(100,85,200,0.04)" stroke="rgba(160,145,255,0.18)" strokeWidth="0.2" />
              <line x1="10.5" y1="18" x2="16.5" y2="18" stroke="rgba(180,170,255,0.14)" strokeWidth="0.15" />
              <line x1="10.5" y1="20.5" x2="15" y2="20.5" stroke="rgba(180,170,255,0.10)" strokeWidth="0.15" />
              <line x1="10.5" y1="23" x2="17" y2="23" stroke="rgba(180,170,255,0.10)" strokeWidth="0.15" />
            </g>
            <g style={{ animation: "float2 26s ease-in-out infinite" }}>
              <rect x="74" y="10" width="10" height="13" rx="1" fill="rgba(80,65,180,0.04)" stroke="rgba(150,135,255,0.15)" strokeWidth="0.2" />
              <line x1="76.5" y1="14" x2="81.5" y2="14" stroke="rgba(170,155,255,0.12)" strokeWidth="0.15" />
              <line x1="76.5" y1="16.5" x2="80" y2="16.5" stroke="rgba(170,155,255,0.09)" strokeWidth="0.15" />
            </g>
            <g style={{ transformOrigin: "50px 46px" }}>
              <circle cx="50" cy="46" r="16" fill="none" stroke="rgba(130,110,255,0.22)" strokeWidth="0.2"
                strokeDasharray="4 3" style={{ transformOrigin: "50px 46px", animation: "ringPulse 40s linear infinite" }} />
              <circle cx="50" cy="46" r="22" fill="none" stroke="rgba(120,100,255,0.16)" strokeWidth="0.18"
                strokeDasharray="6 4" style={{ transformOrigin: "50px 46px", animation: "ringPulseR 55s linear infinite" }} />
              <circle cx="50" cy="46" r="28" fill="none" stroke="rgba(110,90,255,0.12)" strokeWidth="0.15"
                strokeDasharray="8 5" style={{ transformOrigin: "50px 46px", animation: "ringPulse 70s linear infinite" }} />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
