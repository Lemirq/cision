import { MongoClient } from "mongodb";
import type { CollisionRecord } from "@/types/collision";

function normalizeMongoUri(raw: string | undefined) {
  console.log("raw", raw);
  if (!raw) return "";
  let value = raw.trim();
  // Strip surrounding quotes if present
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  // Remove accidental trailing semicolon
  if (value.endsWith(";")) {
    value = value.slice(0, -1);
  }
  // If there is stray punctuation right after the scheme (e.g., "mongodb+srv://;user")
  // normalize it by removing non-alphanumeric chars immediately following "://"
  value = value.replace(
    /^(mongodb(?:\+srv)?:\/\/)\s*[^A-Za-z0-9]+/,
    (_m, scheme) => `${scheme}`
  );
  return value;
}

const uri = process.env.MONGODB_URI;
console.log("uri", uri);
if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined");
}
console.log("uri.startsWith('mongodb://')", uri.startsWith("mongodb://"));
console.log("uri.startsWith('mongodb+srv://')", uri.startsWith("mongodb+srv://"));
if (!(uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"))) {
  throw new Error(
    `❌ Invalid MONGODB_URI. It must start with "mongodb://" or "mongodb+srv://". Received prefix: ${uri.slice(
      0,
      20
    )}...`
  );
}

declare global {
  // prevents multiple connections in dev (hot reload)
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB;
  return client.db(dbName);
}

export async function getCollisionsCollection(collectionName = "collisions_2025") {

  const db = await getDb();
  return db.collection<CollisionRecord>(collectionName);
}