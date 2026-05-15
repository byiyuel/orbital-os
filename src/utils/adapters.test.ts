import { describe, it, expect } from "vitest";
import { adaptWorldBankDataForD3, getLatestValue, formatFinancial } from "@/utils/adapters";

// Sample raw World Bank API response
const mockWorldBankResponse = [
  { page: 1, pages: 1, per_page: 50, total: 5 },
  [
    { date: "2023", value: 27360000000000, country: { value: "United States" }, countryiso3code: "USA" },
    { date: "2022", value: 25460000000000, country: { value: "United States" }, countryiso3code: "USA" },
    { date: "2021", value: 23320000000000, country: { value: "United States" }, countryiso3code: "USA" },
    { date: "2020", value: 21060000000000, country: { value: "United States" }, countryiso3code: "USA" },
    { date: "2019", value: null, country: { value: "United States" }, countryiso3code: "USA" },
  ],
];

describe("adaptWorldBankDataForD3", () => {
  it("transforms raw World Bank data into D3-compatible format", () => {
    const result = adaptWorldBankDataForD3(mockWorldBankResponse);
    expect(result).toHaveLength(4); // null value is filtered out
    expect(result[0]).toEqual({ year: "2020", value: expect.any(Number) });
    expect(result[3]).toEqual({ year: "2023", value: expect.any(Number) });
  });

  it("returns data sorted oldest to newest", () => {
    const result = adaptWorldBankDataForD3(mockWorldBankResponse);
    const years = result.map((d: any) => parseInt(d.year));
    expect(years).toEqual([2020, 2021, 2022, 2023]);
  });

  it("filters out null values", () => {
    const result = adaptWorldBankDataForD3(mockWorldBankResponse);
    const nullEntries = result.filter((d: any) => d.value === null);
    expect(nullEntries).toHaveLength(0);
  });

  it("returns empty array for invalid input", () => {
    expect(adaptWorldBankDataForD3([])).toEqual([]);
    expect(adaptWorldBankDataForD3(null as any)).toEqual([]);
    expect(adaptWorldBankDataForD3([null, null])).toEqual([]);
  });
});

describe("getLatestValue", () => {
  it("extracts the latest non-null value", () => {
    const result = getLatestValue(mockWorldBankResponse);
    expect(result).toEqual({ value: 27360000000000, year: "2023" });
  });

  it("skips null values to find latest", () => {
    const dataWithLeadingNull = [
      { page: 1 },
      [
        { date: "2023", value: null },
        { date: "2022", value: 100 },
      ],
    ];
    const result = getLatestValue(dataWithLeadingNull);
    expect(result).toEqual({ value: 100, year: "2022" });
  });

  it("returns null for empty or invalid data", () => {
    expect(getLatestValue([])).toBeNull();
    expect(getLatestValue(null as any)).toBeNull();
    expect(getLatestValue([null, []])).toBeNull();
  });
});

describe("formatFinancial", () => {
  it("formats trillions correctly", () => {
    expect(formatFinancial(27360000000000)).toBe("$27.36T");
  });

  it("formats billions correctly", () => {
    expect(formatFinancial(512000000000)).toBe("$512.00B");
  });

  it("formats millions correctly", () => {
    expect(formatFinancial(5000000)).toBe("$5.00M");
  });

  it("formats percentages", () => {
    expect(formatFinancial(3.45, "percent")).toBe("3.45%");
    expect(formatFinancial(-1.2, "percent")).toBe("-1.20%");
  });

  it("formats per capita values as currency", () => {
    const result = formatFinancial(65000, "pcap");
    expect(result).toContain("65,000");
  });

  it("handles null and undefined gracefully", () => {
    expect(formatFinancial(null)).toBe("N/A");
    expect(formatFinancial(undefined as any)).toBe("N/A");
  });

  it("handles NaN strings", () => {
    expect(formatFinancial("not-a-number")).toBe("N/A");
  });
});
