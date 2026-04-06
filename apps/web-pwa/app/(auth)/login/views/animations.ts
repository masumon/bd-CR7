export const easeAuth = [0.4, 0, 0.2, 1] as const;

export const slideRight = {
  initial: { opacity: 0, x: 36 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -36 },
};

export const slideLeft = {
  initial: { opacity: 0, x: -36 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 36 },
};

export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
};
