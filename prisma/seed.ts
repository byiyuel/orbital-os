import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Top 30 countries by GDP (nominal, approximate 2023 values in USD)
const TOP_30_COUNTRIES = [
  { code: "USA", name: "United States", region: "North America", incomeGroup: "High income", gdp: 27360e9 },
  { code: "CHN", name: "China", region: "East Asia & Pacific", incomeGroup: "Upper middle income", gdp: 17700e9 },
  { code: "DEU", name: "Germany", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 4450e9 },
  { code: "JPN", name: "Japan", region: "East Asia & Pacific", incomeGroup: "High income", gdp: 4210e9 },
  { code: "IND", name: "India", region: "South Asia", incomeGroup: "Lower middle income", gdp: 3570e9 },
  { code: "GBR", name: "United Kingdom", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 3340e9 },
  { code: "FRA", name: "France", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 3030e9 },
  { code: "ITA", name: "Italy", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 2250e9 },
  { code: "BRA", name: "Brazil", region: "Latin America & Caribbean", incomeGroup: "Upper middle income", gdp: 2170e9 },
  { code: "CAN", name: "Canada", region: "North America", incomeGroup: "High income", gdp: 2140e9 },
  { code: "RUS", name: "Russia", region: "Europe & Central Asia", incomeGroup: "Upper middle income", gdp: 1860e9 },
  { code: "KOR", name: "South Korea", region: "East Asia & Pacific", incomeGroup: "High income", gdp: 1710e9 },
  { code: "AUS", name: "Australia", region: "East Asia & Pacific", incomeGroup: "High income", gdp: 1690e9 },
  { code: "MEX", name: "Mexico", region: "Latin America & Caribbean", incomeGroup: "Upper middle income", gdp: 1320e9 },
  { code: "ESP", name: "Spain", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 1580e9 },
  { code: "IDN", name: "Indonesia", region: "East Asia & Pacific", incomeGroup: "Upper middle income", gdp: 1370e9 },
  { code: "NLD", name: "Netherlands", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 1090e9 },
  { code: "SAU", name: "Saudi Arabia", region: "Middle East & North Africa", incomeGroup: "High income", gdp: 1069e9 },
  { code: "TUR", name: "Turkey", region: "Europe & Central Asia", incomeGroup: "Upper middle income", gdp: 1108e9 },
  { code: "CHE", name: "Switzerland", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 905e9 },
  { code: "POL", name: "Poland", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 842e9 },
  { code: "ARG", name: "Argentina", region: "Latin America & Caribbean", incomeGroup: "Upper middle income", gdp: 621e9 },
  { code: "SWE", name: "Sweden", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 597e9 },
  { code: "NOR", name: "Norway", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 546e9 },
  { code: "BEL", name: "Belgium", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 624e9 },
  { code: "IRL", name: "Ireland", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 533e9 },
  { code: "ISR", name: "Israel", region: "Middle East & North Africa", incomeGroup: "High income", gdp: 525e9 },
  { code: "AUT", name: "Austria", region: "Europe & Central Asia", incomeGroup: "High income", gdp: 516e9 },
  { code: "THA", name: "Thailand", region: "East Asia & Pacific", incomeGroup: "Upper middle income", gdp: 512e9 },
  { code: "NGA", name: "Nigeria", region: "Sub-Saharan Africa", incomeGroup: "Lower middle income", gdp: 472e9 },
];

async function main() {
  console.log("🌍 Seeding Orbital OS database...\n");

  for (const country of TOP_30_COUNTRIES) {
    const record = await prisma.country.upsert({
      where: { code: country.code },
      update: {
        name: country.name,
        region: country.region,
        incomeGroup: country.incomeGroup,
      },
      create: {
        code: country.code,
        name: country.name,
        region: country.region,
        incomeGroup: country.incomeGroup,
      },
    });

    // Seed a baseline economic snapshot (latest available year)
    await prisma.economicSnapshot.upsert({
      where: {
        id: `seed-${country.code}-2023`,
      },
      update: {
        gdp: country.gdp,
      },
      create: {
        id: `seed-${country.code}-2023`,
        countryCode: country.code,
        year: 2023,
        gdp: country.gdp,
      },
    });

    console.log(`  ✓ ${record.code} — ${record.name}`);
  }

  console.log(`\n✅ Seeded ${TOP_30_COUNTRIES.length} countries successfully.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
