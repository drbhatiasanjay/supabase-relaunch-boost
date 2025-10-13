-- Add telegram_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN telegram_id text UNIQUE;

-- Create index for faster telegram_id lookups
CREATE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id);