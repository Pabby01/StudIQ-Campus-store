-- Add wallet_balance to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance numeric default 0;

-- Track processed deposits to prevent double crediting
CREATE TABLE IF NOT EXISTS processed_deposits (
  tx_ref text primary key,
  address text not null references profiles(address),
  amount numeric not null,
  created_at timestamptz default now()
);

-- Create RPC function to atomically credit wallet
CREATE OR REPLACE FUNCTION credit_wallet(
  p_address text,
  p_amount numeric,
  p_tx_ref text
)
RETURNS boolean AS $$
BEGIN
  -- Insert into processed_deposits, will fail if tx_ref already exists (preventing double credit)
  INSERT INTO processed_deposits (tx_ref, address, amount)
  VALUES (p_tx_ref, p_address, p_amount);
  
  -- Credit wallet
  UPDATE profiles
  SET wallet_balance = wallet_balance + p_amount
  WHERE address = p_address;

  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    -- Already processed
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create RPC function to atomically checkout using wallet balance
CREATE OR REPLACE FUNCTION checkout_with_wallet(
  p_buyer_address text,
  p_store_id uuid,
  p_amount numeric,
  p_fee_percent numeric,
  p_fee_amount numeric,
  p_vendor_earnings numeric,
  p_currency text,
  p_delivery_method text,
  p_delivery_info jsonb,
  p_buyer_email text,
  p_escrow_pin text
)
RETURNS uuid AS $$
DECLARE
  v_balance numeric;
  v_order_id uuid;
BEGIN
  -- Lock the profile row for update to prevent race conditions
  SELECT wallet_balance INTO v_balance
  FROM profiles
  WHERE address = p_buyer_address
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Deduct balance
  UPDATE profiles
  SET wallet_balance = wallet_balance - p_amount
  WHERE address = p_buyer_address;

  -- Insert order
  INSERT INTO orders (
    buyer_address,
    store_id,
    status,
    amount,
    fee_percent,
    fee_amount,
    vendor_earnings,
    paid,
    currency,
    delivery_method,
    delivery_info,
    payment_method,
    buyer_email,
    escrow_pin
  ) VALUES (
    p_buyer_address,
    p_store_id,
    'pending',
    p_amount,
    p_fee_percent,
    p_fee_amount,
    p_vendor_earnings,
    true,
    p_currency,
    p_delivery_method,
    p_delivery_info,
    'wallet',
    p_buyer_email,
    p_escrow_pin
  ) RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
