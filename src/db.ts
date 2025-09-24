import { DsqlSigner } from '@aws-sdk/dsql-signer';
import postgres from 'postgres';

export interface DatabaseConfig {
  host?: string;
}

export async function createConnection(config: DatabaseConfig) {
  // DSQL fixed values
  const host = config.host || process.env.PGHOST || 'localhost';
  const port = 5432;
  const database = 'postgres';
  const username = 'admin';

  // Generate DSQL auth token
  const signer = new DsqlSigner({
    hostname: host,
    region: process.env.AWS_REGION || 'us-east-1',
  });

  const password = await signer.getDbConnectAdminAuthToken();

  return postgres({
    host,
    port,
    database,
    username,
    password,
    ssl: { rejectUnauthorized: false },
  });
}

export type Sql = ReturnType<typeof postgres>;
