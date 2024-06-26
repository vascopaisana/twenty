import { global } from '@apollo/client/utilities/globals';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate as postgresMigrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import 'dotenv/config';

const pgClient = postgres(`${global.process.env.DATABASE_PG_URL}`);
const pgDb = drizzle(pgClient, { logger: false });

const migrate = async () => {
  await postgresMigrate(pgDb, {
    migrationsFolder: './src/database/migrations',
  });
};

const findOne = (model: any, orderBy: any) => {
  return pgDb.select().from(model).orderBy(orderBy).limit(1).execute();
};

const findAll = (model: any) => {
  return pgDb.select().from(model).execute();
};

const insertMany = async (
  model: any,
  data: any,
  options?: {
    onConflictKey?: string;
    onConflictUpdateObject?: any;
  },
) => {
  const query = pgDb.insert(model).values(data);

  if (options?.onConflictUpdateObject) {
    if (options?.onConflictKey) {
      return query
        .onConflictDoUpdate({
          target: [model[options.onConflictKey]],
          set: options.onConflictUpdateObject,
        })
        .execute();
    }
  }

  if (options?.onConflictKey) {
    return query
      .onConflictDoNothing({
        target: [model[options.onConflictKey]],
      })
      .execute();
  }
  return query.execute();
};

export { findAll, findOne, insertMany, migrate };
