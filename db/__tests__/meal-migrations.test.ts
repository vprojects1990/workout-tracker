import { db } from '@/db';

// Track all SQL statements executed during migration
const executedStatements: string[] = [];

// Override the mock to capture SQL
jest.mock('@/db', () => ({
  db: {
    run: jest.fn((query: any) => {
      // Drizzle sql tagged template produces an object with queryChunks or sql property
      const sqlStr = query?.queryChunks
        ? query.queryChunks.map((c: any) => (typeof c === 'string' ? c : c?.value ?? '')).join('')
        : String(query);
      executedStatements.push(sqlStr);
      return Promise.resolve();
    }),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => []),
        })),
        orderBy: jest.fn(() => []),
      })),
    })),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Meal Tracking Migrations', () => {
  beforeEach(() => {
    executedStatements.length = 0;
    (db.run as jest.Mock).mockClear();
  });

  it('should execute CREATE TABLE for meal_targets', async () => {
    const { runMigrations } = require('@/db/migrations');
    await runMigrations();

    const allSql = executedStatements.join(' ');
    expect(allSql).toContain('meal_targets');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS');
  });

  it('should execute CREATE TABLE for meal_logs', async () => {
    const { runMigrations } = require('@/db/migrations');
    await runMigrations();

    const allSql = executedStatements.join(' ');
    expect(allSql).toContain('meal_logs');
  });

  it('should create an index on meal_logs date column', async () => {
    const { runMigrations } = require('@/db/migrations');
    await runMigrations();

    const allSql = executedStatements.join(' ');
    expect(allSql).toContain('idx_meal_logs_date');
    expect(allSql).toContain('meal_logs(date)');
  });

  it('should insert default meal targets', async () => {
    const { runMigrations } = require('@/db/migrations');
    await runMigrations();

    const allSql = executedStatements.join(' ');
    expect(allSql).toContain('INSERT OR IGNORE INTO meal_targets');
  });
});
