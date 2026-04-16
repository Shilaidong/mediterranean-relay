-- Supabase Schema: Create stored procedure for purchase transaction
-- Run this in SQL Editor after creating all tables

-- Create the process_purchase function (transaction handler)
CREATE OR REPLACE FUNCTION process_purchase(
  p_buyer_id UUID,
  p_seller_id UUID,
  p_album_id UUID,
  p_price INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deduct credits from buyer
  UPDATE profiles
  SET credits = credits - p_price
  WHERE id = p_buyer_id AND credits >= p_price;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits or buyer not found';
  END IF;

  -- Add credits to seller (if seller exists)
  IF p_seller_id IS NOT NULL THEN
    UPDATE profiles
    SET credits = credits + p_price
    WHERE id = p_seller_id;
  END IF;

  -- Transfer album ownership
  UPDATE albums
  SET owner_id = p_buyer_id, is_listed = false
  WHERE id = p_album_id;

  -- Create transaction record
  INSERT INTO transactions (buyer_id, seller_id, album_id, price, status)
  VALUES (p_buyer_id, p_seller_id, p_album_id, p_price, 'completed');

  -- Create credit transaction records
  INSERT INTO credit_transactions (user_id, amount, type, related_transaction_id, description)
  VALUES
    (p_buyer_id, -p_price, 'purchase', p_album_id, 'Purchased album'),
    (p_seller_id, p_price, 'sale', p_album_id, 'Sold album');

  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_purchase TO authenticated;
