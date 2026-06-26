"use client";

import { useEffect, useState } from "react";

const IMAGES = ["/background.png", "/landscape.png"];
const INTERVAL_MS = 6000;
const FADE_MS = 3000;

export function HeroCrossfade() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % IMAGES.length),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {IMAGES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover transition-opacity"
          style={{
            transitionDuration: `${FADE_MS}ms`,
            opacity: i === index ? 1 : 0,
          }}
        />
      ))}
    </>
  );
}
