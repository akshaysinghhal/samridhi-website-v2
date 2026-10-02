-- Migration 010: pin press clippings to the homepage "As Seen In" strip.
-- Adds a pinned_to_home flag so Admin → Press Coverage can choose exactly
-- which clippings appear on the homepage (pinned first, then latest).
-- Run once in the Supabase SQL editor.
alter table press_clippings
  add column if not exists pinned_to_home boolean default false;
