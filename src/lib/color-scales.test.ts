import { describe, it, expect } from "vitest";
import { getColor, LAYER_CONFIGS } from "./color-scales";

describe("getColor", () => {
  it("returns noDataColor for null, undefined, or NaN", () => {
    const noDataColor = LAYER_CONFIGS.gdp.noDataColor;
    expect(getColor("gdp", null)).toBe(noDataColor);
    expect(getColor("gdp", undefined)).toBe(noDataColor);
    expect(getColor("gdp", NaN)).toBe(noDataColor);

    expect(getColor("inflation", null)).toBe(LAYER_CONFIGS.inflation.noDataColor);
    expect(getColor("growth", undefined)).toBe(LAYER_CONFIGS.growth.noDataColor);
  });

  describe("gdp layer (sqrt normalization)", () => {
    it("handles minimum boundary and below", () => {
      const minColor = LAYER_CONFIGS.gdp.interpolator(0);
      expect(getColor("gdp", 500)).toBe(minColor);
      expect(getColor("gdp", 0)).toBe(minColor); // Clamped to 500
      expect(getColor("gdp", -100)).toBe(minColor);
    });

    it("handles maximum boundary and above", () => {
      const maxColor = LAYER_CONFIGS.gdp.interpolator(1);
      expect(getColor("gdp", 80000)).toBe(maxColor);
      expect(getColor("gdp", 100000)).toBe(maxColor); // Clamped to 80000
    });

    it("handles mid-range value with sqrt normalization", () => {
      // (20375 - 500) / (80000 - 500) = 0.25 -> sqrt(0.25) = 0.5
      const midColor = LAYER_CONFIGS.gdp.interpolator(0.5);
      expect(getColor("gdp", 20375)).toBe(midColor);
    });
  });

  describe("inflation layer (linear normalization)", () => {
    it("handles minimum boundary and below", () => {
      const minColor = LAYER_CONFIGS.inflation.interpolator(0);
      expect(getColor("inflation", 0)).toBe(minColor);
      expect(getColor("inflation", -5)).toBe(minColor); // Clamped to 0
    });

    it("handles maximum boundary and above", () => {
      const maxColor = LAYER_CONFIGS.inflation.interpolator(1);
      expect(getColor("inflation", 15)).toBe(maxColor);
      expect(getColor("inflation", 20)).toBe(maxColor); // Clamped to 15
    });

    it("handles mid-range value with linear normalization", () => {
      // (7.5 - 0) / (15 - 0) = 0.5
      const midColor = LAYER_CONFIGS.inflation.interpolator(0.5);
      expect(getColor("inflation", 7.5)).toBe(midColor);
    });
  });

  describe("growth layer (linear normalization)", () => {
    it("handles minimum boundary and below", () => {
      const minColor = LAYER_CONFIGS.growth.interpolator(0);
      expect(getColor("growth", -5)).toBe(minColor);
      expect(getColor("growth", -10)).toBe(minColor); // Clamped to -5
    });

    it("handles maximum boundary and above", () => {
      const maxColor = LAYER_CONFIGS.growth.interpolator(1);
      expect(getColor("growth", 8)).toBe(maxColor);
      expect(getColor("growth", 15)).toBe(maxColor); // Clamped to 8
    });

    it("handles mid-range value with linear normalization", () => {
      // (1.5 - (-5)) / (8 - (-5)) = 6.5 / 13 = 0.5
      const midColor = LAYER_CONFIGS.growth.interpolator(0.5);
      expect(getColor("growth", 1.5)).toBe(midColor);
    });
  });
});
