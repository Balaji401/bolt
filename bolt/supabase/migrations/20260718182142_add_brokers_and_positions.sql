/*
# TraderOS: Broker Connections & Open Positions

## Overview
Adds tables for broker account connections (auto-sync) and tracks open positions separately from closed trades.

## New Tables
1. `broker_connections` — connected trading accounts (MT4/MT5/cTrader/DXtrade/MatchTrader/Binance/Bybit/OANDA/IBKR etc.). Stores status, sync state, last sync time, and balance.
2. `open_positions` — live open positions synced from broker connections, separate from the closed `trades` table.

## Security
- RLS enabled on both tables.
- Single-tenant: anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS broker_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_name text NOT NULL,
  account_id text,
  account_type text CHECK (account_type IN ('live', 'demo', 'prop')),
  login text,
  server text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'syncing', 'error')),
  auto_sync boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  balance numeric DEFAULT 0,
  equity numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  leverage text DEFAULT '1:30',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_brokers" ON broker_connections;
CREATE POLICY "anon_select_brokers" ON broker_connections FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_brokers" ON broker_connections;
CREATE POLICY "anon_insert_brokers" ON broker_connections FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_brokers" ON broker_connections;
CREATE POLICY "anon_update_brokers" ON broker_connections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_brokers" ON broker_connections;
CREATE POLICY "anon_delete_brokers" ON broker_connections FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS open_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_connection_id uuid REFERENCES broker_connections(id) ON DELETE CASCADE,
  instrument text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('long', 'short')),
  volume numeric NOT NULL,
  entry_price numeric NOT NULL,
  current_price numeric NOT NULL,
  stop_loss numeric,
  take_profit numeric,
  swap numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  floating_pnl numeric NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE open_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_positions" ON open_positions;
CREATE POLICY "anon_select_positions" ON open_positions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_positions" ON open_positions;
CREATE POLICY "anon_insert_positions" ON open_positions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_positions" ON open_positions;
CREATE POLICY "anon_update_positions" ON open_positions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_positions" ON open_positions;
CREATE POLICY "anon_delete_positions" ON open_positions FOR DELETE TO anon, authenticated USING (true);
