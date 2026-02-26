"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TypewriterText({
  text,
  speed = 40,
  delay = 0,
  className,
  onComplete,
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    if (displayed.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    } else {
      onComplete?.();
    }
  }, [displayed, started, text, speed, onComplete]);

  return (
    <span className={cn("font-typewriter", className)}>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="typewriter-cursor" />
      )}
    </span>
  );
}
