import { useRef, useEffect, useState, useCallback } from 'react';
import { useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';

export function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  return scrollYProgress;
}

export function useParallax(ref, speed = 0.5) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => v * speed);
  return y;
}

export function useSectionInView(threshold = 0.3) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

export function useMagneticCursor() {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorScale = useMotionValue(1);

  const springX = useSpring(cursorX, { stiffness: 300, damping: 30 });
  const springY = useSpring(cursorY, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) return;

    const handleMouseMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorX, cursorY]);

  const onHover = useCallback(() => cursorScale.set(4), [cursorScale]);
  const onLeave = useCallback(() => cursorScale.set(1), [cursorScale]);

  return { springX, springY, cursorScale, onHover, onLeave };
}

export function useCardTilt(maxX = 6, maxY = 4) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);
    rotateX.set(-percentY * maxX);
    rotateY.set(percentX * maxY);
  }, [rotateX, rotateY, maxX, maxY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return { springRotateX, springRotateY, handleMouseMove, handleMouseLeave };
}

export function useScrollVelocitySkew() {
  const { scrollY } = useScroll();
  const [velocity, setVelocity] = useState(0);
  const lastScrollY = useRef(0);
  const lastTime = useRef(Date.now());

  const skew = useSpring(0, { stiffness: 400, damping: 90 });

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      const now = Date.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        const v = (latest - lastScrollY.current) / dt;
        const clampedSkew = Math.max(-3, Math.min(3, v * 50));
        skew.set(clampedSkew);
      }
      lastScrollY.current = latest;
      lastTime.current = now;
    });
  }, [scrollY, skew]);

  return skew;
}

export function useExpoCounter(end, duration = 2000, trigger = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let startTime = null;
    let raf;

    const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      setValue(Math.round(easedProgress * end));

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, trigger]);

  return value;
}
