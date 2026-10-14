import { pgTable, text, timestamp, numeric, integer, uuid, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (keyed directly by Firebase Auth UID)
export const users = pgTable('users', {
  uid: text('uid').primaryKey().notNull(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sport predictions & analysis history
export const history = pgTable('history', {
  id: text('id').primaryKey().notNull(), // Matching client-side result.id
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  sport: text('sport').notNull(), // 'football' or 'basketball'
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  predictionData: text('prediction_data').notNull(), // JSON string representing the full analysis result
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Bets placed by user
export const bets = pgTable('bets', {
  id: text('id').primaryKey().notNull(), // Matching client-side bet.id
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  matchName: text('match_name').notNull(),
  sport: text('sport').notNull(),
  odds: numeric('odds', { precision: 5, scale: 2 }).notNull(),
  stake: numeric('stake', { precision: 10, scale: 2 }).notNull(),
  betType: text('bet_type').notNull(),
  prediction: text('prediction').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'won', 'lost', 'void'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Bankroll details for user
export const bankroll = pgTable('bankroll', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  initialBalance: numeric('initial_balance', { precision: 12, scale: 2 }).default('1000.00').notNull(),
  currentBalance: numeric('current_balance', { precision: 12, scale: 2 }).default('1000.00').notNull(),
  currency: text('currency').default('EUR').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Analysis Logs (Detailed step-by-step logs of Gemini processing)
export const analysisLogs = pgTable('analysis_logs', {
  id: text('id').primaryKey().notNull(), // Matching client-side log.id
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  matchName: text('match_name').notNull(),
  logContent: text('log_content').notNull(), // JSON string of logs
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define Relationships for clean joins
export const usersRelations = relations(users, ({ many, one }) => ({
  history: many(history),
  bets: many(bets),
  bankroll: one(bankroll, {
    fields: [users.uid],
    references: [bankroll.userId],
  }),
  analysisLogs: many(analysisLogs),
}));

export const historyRelations = relations(history, ({ one }) => ({
  user: one(users, {
    fields: [history.userId],
    references: [users.uid],
  }),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.uid],
  }),
}));

export const bankrollRelations = relations(bankroll, ({ one }) => ({
  user: one(users, {
    fields: [bankroll.userId],
    references: [users.uid],
  }),
}));

export const analysisLogsRelations = relations(analysisLogs, ({ one }) => ({
  user: one(users, {
    fields: [analysisLogs.userId],
    references: [users.uid],
  }),
}));
