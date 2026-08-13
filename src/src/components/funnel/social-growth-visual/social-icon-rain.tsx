"use client";

import { useEffect, useState } from "react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export function SocialIconRain() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Pre-defined static configuration to avoid hydration mismatch
  const particles = [
    // LEFT SIDE
    { id: 'l1', Icon: FaInstagram, side: 'left', size: 24, color: 'text-pink-500', opacity: 0.25, top: '-10%', left: '8%', duration: 18, delay: 0 },
    { id: 'l2', Icon: FaTiktok, side: 'left', size: 18, color: 'text-[#00f2fe]', opacity: 0.20, top: '-20%', left: '15%', duration: 22, delay: 2 },
    { id: 'l3', Icon: FaFacebook, side: 'left', size: 28, color: 'text-blue-500', opacity: 0.18, top: '-5%', left: '4%', duration: 15, delay: 5 },
    { id: 'l4', Icon: FaXTwitter, side: 'left', size: 20, color: 'text-white', opacity: 0.22, top: '-30%', left: '12%', duration: 20, delay: 7 },
    { id: 'l5', Icon: FaInstagram, side: 'left', size: 16, color: 'text-purple-500', opacity: 0.28, top: '-15%', left: '2%', duration: 16, delay: 9 },

    // RIGHT SIDE
    { id: 'r1', Icon: FaTiktok, side: 'right', size: 26, color: 'text-[#fe0979]', opacity: 0.25, top: '-5%', right: '5%', duration: 17, delay: 1 },
    { id: 'r2', Icon: FaInstagram, side: 'right', size: 20, color: 'text-orange-400', opacity: 0.20, top: '-25%', right: '12%', duration: 21, delay: 3 },
    { id: 'r3', Icon: FaXTwitter, side: 'right', size: 24, color: 'text-neutral-400', opacity: 0.18, top: '-15%', right: '8%', duration: 19, delay: 6 },
    { id: 'r4', Icon: FaFacebook, side: 'right', size: 18, color: 'text-cyan-500', opacity: 0.22, top: '-35%', right: '3%', duration: 23, delay: 8 },
    { id: 'r5', Icon: FaTiktok, side: 'right', size: 22, color: 'text-[#00f2fe]', opacity: 0.19, top: '-10%', right: '15%', duration: 16, delay: 10 },
  ];

  // In mobile, we dramatically reduce the amount to only 3 items globally
  const activeParticles = isMobile 
    ? [particles[0], particles[5], particles[3]] 
    : particles;

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none">
      
      {/* Custom Styles for Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (prefers-reduced-motion: no-preference) {
          @keyframes ambient-fall {
            0% { transform: translateY(-50px) translateX(0px) rotate(0deg); }
            50% { transform: translateY(50vh) translateX(15px) rotate(15deg); }
            100% { transform: translateY(110vh) translateX(-10px) rotate(-10deg); }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .particle-animate {
            animation: none !important;
            transform: translateY(20vh) !important; /* Keep them static but visible slightly down */
          }
        }
      `}} />

      {activeParticles.map((p) => (
        <div
          key={p.id}
          className="absolute particle-animate"
          style={{
            top: p.top,
            ...(p.side === 'left' ? { left: p.left } : { right: p.right }),
            opacity: isMobile ? p.opacity * 0.7 : p.opacity, // even lower opacity on mobile
            animation: `ambient-fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            filter: `drop-shadow(0 0 8px currentColor)`,
          }}
        >
          <p.Icon 
            className={p.color} 
            style={{ 
              width: isMobile ? p.size * 0.7 : p.size, 
              height: isMobile ? p.size * 0.7 : p.size 
            }} 
          />
        </div>
      ))}

    </div>
  );
}
