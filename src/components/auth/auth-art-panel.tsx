"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ArtAttribution } from "@/components/ui/art-attribution";

const IMAGES = [
  "/art/sylvain-sarrailh-the-penultimate-lesson.webp",
  "/art/sylvain-sarrailh-fjord.jpg",
  "/art/sylvain-sarrailh-sailorsunset.jpg",
  "/art/sylvain-sarrailh-peak-of-snake.jpg",
  "/art/sylvain-sarrailh-ghostsofthemeadow.jpg",
  "/art/sylvain-sarrailh-the-creek.jpg",
  "/art/sylvain-sarrailh-dol-environment-concept-a.jpg",
  "/art/sylvain-sarrailh-danghostcoastline.jpg",
  "/art/sylvain-sarrailh-infrabass.jpg",
  "/art/sylvain-sarrailh-metazoo-knifeedge.jpg",
  "/art/sylvain-sarrailh-the-equinox-hunt.webp",
  "/art/sylvain-sarrailh-the-guardians-of-autumn.jpg",
  "/art/sylvain-sarrailh-yellowruins.jpg",
  "/art/sylvain-sarrailh-g2-esports.jpg",
  "/art/sylvain-sarrailh-agatetoanewworld.jpg",
  "/art/sylvain-sarrailh-hiddenpathway.jpg",
  "/art/sylvain-sarrailh-pillars.jpg",
  "/art/sylvain-sarrailh-the-oasis.jpg",
  "/art/sylvain-sarrailh-wandering.jpg",
];

export function AuthArtPanel() {
  // Two slots — one always visible, one preloaded underneath
  const [slots, setSlots] = useState([IMAGES[0], IMAGES[1]]);
  const [topSlot, setTopSlot] = useState(0);
  const counterRef = useRef(0);

  useEffect(() => {
    const start = Math.floor(Math.random() * IMAGES.length);
    counterRef.current = start;
    setSlots([IMAGES[start], IMAGES[(start + 1) % IMAGES.length]]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      counterRef.current = (counterRef.current + 1) % IMAGES.length;
      const upcoming = IMAGES[(counterRef.current + 1) % IMAGES.length];

      setTopSlot((prev) => {
        const next = prev === 0 ? 1 : 0;
        const bottomSlot = prev;
        // After the crossfade finishes, load the next image into the slot
        // that just went underneath so it's ready for the next cycle
        setTimeout(() => {
          setSlots((s) => {
            const updated = [...s];
            updated[bottomSlot] = upcoming;
            return updated;
          });
        }, 800);
        return next;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slots.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover scale-110 transition-opacity duration-700",
            i === topSlot ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />
      ))}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute bottom-4 left-4 z-10">
        <ArtAttribution />
      </div>
    </div>
  );
}
