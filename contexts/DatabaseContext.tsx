import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '@/db';
import { runMigrations } from '@/db/migrations';
import { seedDatabase } from '@/db/seed';

type DatabaseContextType = {
  isReady: boolean;
  error: Error | null;
};

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
  error: null,
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initDatabase() {
      try {
        await runMigrations();
        await seedDatabase();
        setIsReady(true);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Database initialization failed'));
      }
    }

    initDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
