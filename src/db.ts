import postgres from 'postgres';

export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
}

export function createConnection(config: DatabaseConfig) {
  if (config.connectionString) {
    // Ensure SSL is enabled in connection string
    const connectionString = config.connectionString.includes('?ssl=')
      ? config.connectionString
      : config.connectionString + (config.connectionString.includes('?') ? '&ssl=true' : '?ssl=true');

    return postgres(connectionString, {
      ssl: { rejectUnauthorized: false }
    });
  }

  // Check if we have any explicit config values
  const hasExplicitConfig = config.host || config.port || config.database || config.username || config.password;

  if (!hasExplicitConfig) {
    // Use postgres() without arguments to let it use PG* environment variables, with SSL enabled
    return postgres({
      ssl: { rejectUnauthorized: false }
    });
  }

  // Build explicit config, but don't override env vars with undefined values
  const postgresConfig: any = {
    ssl: { rejectUnauthorized: false }
  };

  if (config.host !== undefined) postgresConfig.host = config.host;
  if (config.port !== undefined) postgresConfig.port = config.port;
  if (config.database !== undefined) postgresConfig.database = config.database;
  if (config.username !== undefined) postgresConfig.username = config.username;
  if (config.password !== undefined) postgresConfig.password = config.password;

  return postgres(postgresConfig);
}

export type Sql = ReturnType<typeof postgres>;