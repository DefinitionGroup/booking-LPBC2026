export const transitions = {
  fast: { duration: 0.22, ease: "easeOut" as const },
  smooth: { duration: 0.34, ease: "easeOut" as const },
  spring: { type: "spring" as const, stiffness: 360, damping: 34, mass: 0.7 },
};

export const variants = {
  fadeInUp: {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
  stagger: {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.03,
      },
    },
  },
};
