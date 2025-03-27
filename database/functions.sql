-- Function to use a credit
CREATE OR REPLACE FUNCTION use_credit(details_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM user_profiles
  WHERE user_id = auth.uid();
  
  -- Check if user has enough credits
  IF current_credits < 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Update user's credits
  UPDATE user_profiles
  SET credits = credits - 1
  WHERE user_id = auth.uid();
  
  -- Record transaction
  INSERT INTO credit_transactions (user_id, amount, type, details)
  VALUES (auth.uid(), -1, 'usage', details_param);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases)
CREATE OR REPLACE FUNCTION add_credits(amount_param INTEGER, details_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update user's credits
  UPDATE user_profiles
  SET credits = credits + amount_param
  WHERE user_id = auth.uid();
  
  -- Record transaction
  INSERT INTO credit_transactions (user_id, amount, type, details)
  VALUES (auth.uid(), amount_param, 'purchase', details_param);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
