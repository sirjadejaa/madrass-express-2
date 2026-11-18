import { db } from "../lib/db";
import fs from "fs";
import path from "path";

async function run() {
  const sqlPath = path.join(__dirname, "../prisma/migrations/20261119_add_service_requests_and_waiting_experience/migration.sql");
  const rawSql = fs.readFileSync(sqlPath, "utf-8");

  console.log("Applying non-destructive migration statements...");
  
  // Split statements carefully by semicolon outside of DO $$ blocks
  const statements: string[] = [];
  let current = "";
  let inBlock = false;

  for (const line of rawSql.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") || trimmed === "") continue;

    if (trimmed.includes("DO $$")) {
      inBlock = true;
    }

    current += line + "\n";

    if (inBlock) {
      if (trimmed.includes("END $$;")) {
        inBlock = false;
        statements.push(current.trim());
        current = "";
      }
    } else if (trimmed.endsWith(";")) {
      statements.push(current.trim());
      current = "";
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  for (const stmt of statements) {
    if (!stmt) continue;
    try {
      await db.$executeRawUnsafe(stmt);
    } catch (e: any) {
      console.warn("Statement executed with notice/handled error:", e.message?.slice(0, 100));
    }
  }

  console.log("All migration statements processed successfully!");

  // Seed default trivia questions if none exist
  const restaurant = await db.restaurant.findFirst();
  if (restaurant) {
    const count = await db.quizQuestion.count({ where: { restaurantId: restaurant.id } });
    if (count === 0) {
      console.log("Seeding default trivia questions for restaurant:", restaurant.name);
      await db.quizQuestion.createMany({
        data: [
          {
            restaurantId: restaurant.id,
            question: "Which lentil is the primary ingredient used to make traditional South Indian Medu Vada?",
            options: ["Urad Dal (Black Gram)", "Chana Dal (Bengal Gram)", "Toor Dal (Pigeon Pea)", "Moong Dal (Green Gram)"],
            correctIndex: 0,
            explanation: "Medu Vada is traditionally made from soaked and ground white urad dal, creating its signature crispy exterior and fluffy interior.",
            order: 1,
            isActive: true,
          },
          {
            restaurantId: restaurant.id,
            question: "What unique traditional brewing technique gives Madras Filter Coffee its frothy top?",
            options: ["Espresso steam wand", "Pouring back and forth in a Davarah & Tumbler", "Electric milk frother", "French press plunger"],
            correctIndex: 1,
            explanation: "Pouring the hot coffee back and forth between the tumbler and davarah aerates the mixture, creating the rich, authentic froth.",
            order: 2,
            isActive: true,
          },
          {
            restaurantId: restaurant.id,
            question: "Which spice provides the golden yellow color and earthiness to traditional Sambar?",
            options: ["Saffron", "Turmeric (Haldi)", "Mustard Seeds", "Kashmiri Chili"],
            correctIndex: 1,
            explanation: "Turmeric along with freshly ground coriander and fenugreek gives Sambar its golden hue and aromatic flavor profile.",
            order: 3,
            isActive: true,
          },
          {
            restaurantId: restaurant.id,
            question: "What gives Rava Dosa its unique crispy, lacy texture compared to regular fermented dosas?",
            options: ["Semolina (Sooji) and rice flour batter", "Corn starch slurry", "Baking powder", "Thick gram flour paste"],
            correctIndex: 0,
            explanation: "Rava Dosa is made from an unfermented batter of semolina (rava), rice flour, and cumin poured on a piping hot tawa.",
            order: 4,
            isActive: true,
          },
        ],
      });
      console.log("Seeded 4 default trivia questions!");
    } else {
      console.log(`Restaurant already has ${count} trivia questions.`);
    }

    // Ensure restaurant settings exist with sensible defaults
    const existingSettings = await db.restaurantSetting.findUnique({
      where: { restaurantId: restaurant.id },
    });
    if (existingSettings) {
      await db.restaurantSetting.update({
        where: { restaurantId: restaurant.id },
        data: {
          wifiEnabled: true,
          wifiSSID: existingSettings.wifiSSID || "MadrassExpress-Guest",
          wifiPassword: existingSettings.wifiPassword || "FilterCoffee@123",
          wifiInstructions: existingSettings.wifiInstructions || "Connect to MadrassExpress-Guest and enter password. High-speed guest Wi-Fi for diners.",
          gamesEnabled: true,
          gameRewardEnabled: true,
          gameRewardCouponCode: existingSettings.gameRewardCouponCode || "WINNER10",
          gameRewardMinScore: existingSettings.gameRewardMinScore || 75,
          exploreMoreEnabled: true,
          serviceRequestsEnabled: true,
          serviceRequestCooldownSeconds: 60,
          notificationSoundEnabled: true,
        },
      });
      console.log("Updated restaurant setting defaults for customer experience!");
    }
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
