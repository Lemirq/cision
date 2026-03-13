// DEMO MODE: Hard-coded response, no external API calls
// This file is kept as a dummy export so any lingering imports don't break the build.
// No actual MongoDB connection is made.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clientPromise: Promise<any> = Promise.reject(
  new Error("MongoDB is disabled in demo mode")
);

// Prevent unhandled rejection warnings
clientPromise.catch(() => {});

export default clientPromise;
