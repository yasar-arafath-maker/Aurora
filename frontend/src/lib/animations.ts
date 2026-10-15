/**
 * AURORA SCADA Animation Library
 * Centralized Framer Motion animation variants, transitions, and utilities.
 */
import { Variants, Transition } from 'framer-motion';

// ─── Timing Constants ─────────────────────────────────────────────
export const STAGGER_FAST = 0.06;
export const STAGGER_DEFAULT = 0.1;
export const STAGGER_SLOW = 0.15;

// ─── Easing Curves ────────────────────────────────────────────────
export const easeOutExpo: Transition = { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.7 };
export const easeOutQuart: Transition = { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.5 };
export const springSnappy: Transition = { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 };
export const springSmooth: Transition = { type: 'spring', stiffness: 200, damping: 22, mass: 1 };
export const springBouncy: Transition = { type: 'spring', stiffness: 400, damping: 20, mass: 0.6 };

// ─── Page-Level Transitions ───────────────────────────────────────
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
    transition: { duration: 0.3, ease: [0.7, 0, 0.84, 0] },
  },
};

// ─── Stagger Container ────────────────────────────────────────────
export const staggerContainer = (staggerDelay = STAGGER_DEFAULT): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
});

// ─── Fade In / Up  ────────────────────────────────────────────────
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Fade In / Down ───────────────────────────────────────────────
export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Fade In / Left ──────────────────────────────────────────────
export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Fade In / Right ─────────────────────────────────────────────
export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Scale In (Pop) ──────────────────────────────────────────────
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// ─── Glow Pulse (for SCADA status indicators) ───────────────────
export const glowPulse: Variants = {
  initial: { boxShadow: '0 0 0 0 rgba(34, 230, 196, 0)' },
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(34, 230, 196, 0)',
      '0 0 20px 4px rgba(34, 230, 196, 0.3)',
      '0 0 0 0 rgba(34, 230, 196, 0)',
    ],
    transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
  },
};

// ─── Card Hover Effect ───────────────────────────────────────────
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -2,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  tap: { scale: 0.98 },
};

// ─── Sidebar Item ────────────────────────────────────────────────
export const sidebarItem: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Modal / Overlay ─────────────────────────────────────────────
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
};

// ─── Table Row Stagger ───────────────────────────────────────────
export const tableRow: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── Weather Impact Chain Step ───────────────────────────────────
export const chainStep: Variants = {
  initial: { opacity: 0, scale: 0.8, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 22 },
  },
};

// ─── Arrow Connector ─────────────────────────────────────────────
export const arrowConnector: Variants = {
  initial: { opacity: 0, scaleX: 0 },
  animate: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Battery Rack Tray Fill ──────────────────────────────────────
export const rackTray = (index: number): Variants => ({
  initial: { opacity: 0, scaleX: 0.3 },
  animate: {
    opacity: 1,
    scaleX: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
});

// ─── Counter Shimmer  ────────────────────────────────────────────
export const shimmer: Variants = {
  initial: { backgroundPosition: '-200% center' },
  animate: {
    backgroundPosition: '200% center',
    transition: { repeat: Infinity, duration: 3, ease: 'linear' },
  },
};

// ─── Login Form ──────────────────────────────────────────────────
export const loginCard: Variants = {
  initial: { opacity: 0, y: 40, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export const loginField: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Floating Particles (for Login background) ──────────────────
export const floatingParticle = (i: number) => ({
  animate: {
    y: [0, -30 - (i % 3) * 10, 0],
    x: [0, 15 * (i % 2 === 0 ? 1 : -1), 0],
    opacity: [0.2, 0.6, 0.2],
    transition: {
      repeat: Infinity,
      duration: 4 + (i % 3),
      ease: 'easeInOut',
      delay: i * 0.3,
    },
  },
});

// ─── Notification / Toast ────────────────────────────────────────
export const toastVariants: Variants = {
  initial: { opacity: 0, y: -30, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// ─── Gauge Arc Sweep ─────────────────────────────────────────────
export const gaugeArc: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Formula Card Reveal ─────────────────────────────────────────
export const formulaReveal = (index: number): Variants => ({
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.08,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
});
