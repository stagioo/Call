import confetti from "canvas-confetti";

export function confettiBurst(options: Parameters<typeof confetti>[0] = {}) {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    ...options,
  });
}
