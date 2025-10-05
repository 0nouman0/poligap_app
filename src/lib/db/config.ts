export const DB_CONFIG = {
  main: {
    uri: process.env.MONGODB_URI,
    name: "poligap",
  },
} as const;

export type DatabaseName = keyof typeof DB_CONFIG;
export type DbConfig<T extends DatabaseName> = (typeof DB_CONFIG)[T];
