import type { RandomSource } from "@/domain/types";

export class MathRandomSource implements RandomSource {
  next(): number {
    return Math.random();
  }
}

export class Mulberry32RandomSource implements RandomSource {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    let nextSeed = (this.seed += 0x6d2b79f5);
    nextSeed = Math.imul(nextSeed ^ (nextSeed >>> 15), nextSeed | 1);
    nextSeed ^= nextSeed + Math.imul(nextSeed ^ (nextSeed >>> 7), nextSeed | 61);
    const value = ((nextSeed ^ (nextSeed >>> 14)) >>> 0) / 4294967296;
    return value;
  }
}
