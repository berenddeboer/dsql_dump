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

  // Extract region from hostname if possible, otherwise use env var or default
  function extractRegionFromHost(hostname: string): string {
    const match = hostname.match(/\.dsql\.([^.]+)\.on\.aws$/);
    if (match && match[1]) {
      return match[1];
    }
    return process.env.AWS_REGION ?? 'us-east-1';
  }

  // Generate DSQL auth token
  const signer = new DsqlSigner({
    hostname: host,
    region: extractRegionFromHost(host),
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
