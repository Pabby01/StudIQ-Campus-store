-- Migration: Add primary_intent to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_intent text DEFAULT 'buying';
