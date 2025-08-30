-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create typing_tests table for test results
CREATE TABLE public.typing_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wpm INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  raw_wpm INTEGER NOT NULL,
  correct_characters INTEGER NOT NULL,
  incorrect_characters INTEGER NOT NULL,
  extra_characters INTEGER NOT NULL,
  missed_characters INTEGER NOT NULL,
  total_characters INTEGER NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  mode TEXT NOT NULL DEFAULT 'time', -- 'time', 'words', 'quote'
  difficulty TEXT NOT NULL DEFAULT 'normal', -- 'easy', 'normal', 'hard'
  language TEXT NOT NULL DEFAULT 'english',
  test_text TEXT NOT NULL,
  typed_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.typing_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for typing_tests
CREATE POLICY "Users can view all typing tests" 
ON public.typing_tests 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own typing tests" 
ON public.typing_tests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_typing_tests_user_id ON public.typing_tests(user_id);
CREATE INDEX idx_typing_tests_wpm ON public.typing_tests(wpm DESC);
CREATE INDEX idx_typing_tests_created_at ON public.typing_tests(created_at DESC);
CREATE INDEX idx_profiles_username ON public.profiles(username);