import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Read environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = envContent.split("\n").reduce((acc, line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    acc[key.trim()] = valueParts.join("=").trim();
  }
  return acc;
}, {} as Record<string, string>);

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyDatabase() {
  console.log("🔍 Verifying Supabase Database Configuration\n");
  console.log("Supabase URL:", SUPABASE_URL);
  console.log("Service Role Key:", SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + "...\n");

  // Check 1: Verify connection
  console.log("1️⃣ Testing database connection...");
  try {
    const { error } = await supabase.from("companies").select("count", { count: "exact", head: true });
    if (error) {
      console.error("❌ Connection failed:", error.message);
      return;
    }
    console.log("✅ Database connection successful\n");
  } catch (error) {
    console.error("❌ Connection error:", error);
    return;
  }

  // Check 2: Verify tables exist
  console.log("2️⃣ Checking if required tables exist...");
  const tables = [
    "companies",
    "questionnaires",
    "questionnaire_responses",
    "services",
    "company_services",
    "assets",
    "secrets",
    "audit_logs",
    "invitations"
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        console.error(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (error: any) {
      console.error(`❌ Table '${table}': ${error.message}`);
    }
  }

  // Check 3: Verify pgcrypto extension
  console.log("\n3️⃣ Checking pgcrypto extension...");
  try {
    const { data, error } = await supabase.rpc("pg_extension_exists", { extension_name: "pgcrypto" });
    if (error) {
      // Try alternative method
      const { data: extData, error: extError } = await supabase
        .from("pg_extension")
        .select("extname")
        .eq("extname", "pgcrypto")
        .maybeSingle();

      if (extError) {
        console.log("⚠️  Could not verify pgcrypto extension (may need manual check)");
      } else if (extData) {
        console.log("✅ pgcrypto extension is installed");
      } else {
        console.log("❌ pgcrypto extension not found");
      }
    } else {
      console.log(data ? "✅ pgcrypto extension is installed" : "❌ pgcrypto extension not found");
    }
  } catch (error: any) {
    console.log("⚠️  Could not verify pgcrypto extension:", error.message);
  }

  // Check 4: Count records in key tables
  console.log("\n4️⃣ Checking record counts...");
  for (const table of ["companies", "questionnaires", "services"]) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count ?? 0} records`);
      }
    } catch (error: any) {
      console.error(`❌ ${table}: ${error.message}`);
    }
  }

  // Check 5: Verify authentication configuration
  console.log("\n5️⃣ Checking authentication configuration...");
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log("⚠️  Could not verify auth configuration (this is normal)");
    } else if (data.session) {
      console.log("✅ Authentication system is configured");
    } else {
      console.log("ℹ️  No active session (this is expected for server-side check)");
    }
  } catch (error: any) {
    console.log("⚠️  Could not verify auth configuration:", error.message);
  }

  console.log("\n✨ Database verification complete!");
}

verifyDatabase().catch(console.error);
