-- Create colleges table to store college data
CREATE TABLE public.colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sr_no INTEGER NOT NULL,
  college_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  cutoff DECIMAL NOT NULL,
  number_outside_bracket INTEGER NOT NULL,
  number_inside_bracket INTEGER NOT NULL,
  order_position INTEGER NOT NULL,
  original_order INTEGER,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_sessions table to store session state
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  last_action TEXT,
  last_action_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for colleges table
CREATE POLICY "Users can view their own colleges" 
ON public.colleges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own colleges" 
ON public.colleges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own colleges" 
ON public.colleges 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own colleges" 
ON public.colleges 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for user_sessions table
CREATE POLICY "Users can view their own session" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own session" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_colleges_updated_at
  BEFORE UPDATE ON public.colleges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_colleges_user_id ON public.colleges(user_id);
CREATE INDEX idx_colleges_order ON public.colleges(order_position);
CREATE INDEX idx_colleges_deleted ON public.colleges(is_deleted);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);