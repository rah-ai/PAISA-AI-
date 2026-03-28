import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const curtainEase = [0.76, 0, 0.24, 1];

/* 01. Curtain Mask Reveal — headlines */
export function CurtainReveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05, rootMargin: '100px' });

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '110%' }}
        animate={inView ? { y: 0 } : { y: '110%' }}
        transition={{ duration: 0.9, ease: curtainEase, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* 02. Word Split Reveal — subheadings */
export function WordSplitReveal({ text, delay = 0, className = '' }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05, rootMargin: '100px' });
  const words = text.split(' ');

  return (
    <span ref={ref} className={className} style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0 6px' }}>
      {words.map((word, i) => (
        <span key={i} style={{ overflow: 'hidden', display: 'inline-block' }}>
          <motion.span
            style={{ display: 'inline-block' }}
            initial={{ y: '100%' }}
            animate={inView ? { y: 0 } : { y: '100%' }}
            transition={{ duration: 0.5, ease: curtainEase, delay: delay + i * 0.04 }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* 03. Blur Focus Reveal — body text */
export function BlurReveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05, rootMargin: '100px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: 'blur(8px)' }}
      animate={inView ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.8, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

/* 05. Line Draw Reveal — horizontal dividers */
export function LineReveal({ delay = 0, className = '' }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05, rootMargin: '100px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ height: '1px', background: 'var(--bg-border)', transformOrigin: 'left' }}
      initial={{ scaleX: 0 }}
      animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
      transition={{ duration: 0.6, ease: curtainEase, delay }}
    />
  );
}

/* 14. Clip-Path Wipe — cards */
export function ClipPathWipe({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0, rootMargin: '200px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ clipPath: 'inset(100% 0 0 0)', opacity: 0 }}
      animate={inView ? { clipPath: 'inset(0% 0 0 0)', opacity: 1 } : { clipPath: 'inset(100% 0 0 0)', opacity: 0 }}
      transition={{ duration: 0.8, ease: curtainEase, delay }}
    >
      {children}
    </motion.div>
  );
}

/* 16. Elastic Spring Entrance — cards */
export function ElasticSpring({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0, rootMargin: '200px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: 40, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25, delay }}
    >
      {children}
    </motion.div>
  );
}

/* 19. Table Row Cascade */
export function RowCascade({ children, index = 0, className = '' }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0, rootMargin: '200px' });

  return (
    <motion.tr
      ref={ref}
      className={className}
      initial={{ x: -20, opacity: 0 }}
      animate={inView ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.06 }}
    >
      {children}
    </motion.tr>
  );
}

/* 26. Ring Ripple — button clicks */
export function RippleButton({ children, className = '', onClick, ...props }) {
  const [ripples, setRipples] = React.useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick?.(e);
  };

  return (
    <button className={className} onClick={handleClick} style={{ position: 'relative', overflow: 'hidden' }} {...props}>
      {children}
      {ripples.map(r => (
        <motion.span
          key={r.id}
          style={{
            position: 'absolute', left: r.x, top: r.y,
            width: 10, height: 10, borderRadius: '50%',
            border: '2px solid var(--gold-mid)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      ))}
    </button>
  );
}

/* 30. Word Streaming — AI responses */
export function WordStream({ text, speed = 30 }) {
  const [displayed, setDisplayed] = React.useState('');
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!text) return;
    setDisplayed('');
    setDone(false);
    const words = text.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        setDisplayed(prev => prev + (i === 0 ? '' : ' ') + words[i]);
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

/* 34. Page Transition wrapper */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: 'easeInOut' }
};
