import { describe, expect, it } from "vitest";
import { bucketFor, cursorLens, FIELD, rippleBand } from "./signalField";

describe("rippleBand", () => {
    it("is brightest on the ring and falls off either side of it", () => {
        const age = 0.5;
        const radius = age * FIELD.speed;
        const onRing = rippleBand(radius, age);
        expect(onRing).toBeGreaterThan(rippleBand(radius - FIELD.width, age));
        expect(onRing).toBeGreaterThan(rippleBand(radius + FIELD.width, age));
    });

    it("fades as the pulse ages and is gone at the end of its life", () => {
        const at = (age: number) => rippleBand(age * FIELD.speed, age);
        expect(at(0.2)).toBeGreaterThan(at(1.5));
        expect(at(FIELD.life)).toBe(0);
        expect(rippleBand(0, -0.1)).toBe(0);
    });

    it("ignores dots far from the ring", () => {
        expect(rippleBand(1000, 0.2)).toBe(0);
    });
});

describe("cursorLens", () => {
    it("is 1 under the pointer and 0 at or beyond the radius", () => {
        expect(cursorLens(0, 100)).toBe(1);
        expect(cursorLens(100, 100)).toBe(0);
        expect(cursorLens(150, 100)).toBe(0);
        expect(cursorLens(50, 100)).toBeCloseTo(0.25);
    });
});

describe("bucketFor", () => {
    it("clamps brightness into the available batches", () => {
        expect(bucketFor(0, 10)).toBe(0);
        expect(bucketFor(0.55, 10)).toBe(5);
        expect(bucketFor(3, 10)).toBe(9);
    });
});
