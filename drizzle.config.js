/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./utils/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:T3ctvnldg5Mx@ep-autumn-cloud-a551u022.us-east-2.aws.neon.tech/mockai?sslmode=require",
  },
};
