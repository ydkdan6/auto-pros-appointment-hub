-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('customer', 'admin', 'technician');

-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('pending', 'approved', 'rejected', 'in_progress', 'completed');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  is_approved BOOLEAN NOT NULL DEFAULT true, -- customers auto-approved, technicians need approval
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  fault_description TEXT NOT NULL CHECK (length(fault_description) <= 200),
  reason_description TEXT NOT NULL CHECK (length(reason_description) <= 500),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  technician_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  admin_notes TEXT,
  rejection_reason TEXT,
  estimated_duration_hours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table for technician assignments
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  estimated_duration_hours INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(is_approved, false) FROM public.profiles WHERE user_id = user_uuid;
$$;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile and admins can view all"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for appointments table
CREATE POLICY "Customers can view their own appointments, admins and technicians can view all"
ON public.appointments FOR SELECT
USING (
  customer_id = auth.uid() OR 
  technician_id = auth.uid() OR
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Customers can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (
  customer_id = auth.uid() AND
  public.get_user_role(auth.uid()) = 'customer'
);

CREATE POLICY "Customers can update their own pending appointments"
ON public.appointments FOR UPDATE
USING (
  customer_id = auth.uid() AND 
  status = 'pending' AND
  public.get_user_role(auth.uid()) = 'customer'
);

CREATE POLICY "Admins can update any appointment"
ON public.appointments FOR UPDATE
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Technicians can update status of their assigned appointments"
ON public.appointments FOR UPDATE
USING (
  technician_id = auth.uid() AND
  public.get_user_role(auth.uid()) = 'technician' AND
  public.is_user_approved(auth.uid()) = true
);

-- RLS Policies for tasks table
CREATE POLICY "Technicians can view their assigned tasks, admins can view all"
ON public.tasks FOR SELECT
USING (
  technician_id = auth.uid() OR
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Admins can create and update tasks"
ON public.tasks FOR ALL
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Technicians can update their own task status"
ON public.tasks FOR UPDATE
USING (
  technician_id = auth.uid() AND
  public.get_user_role(auth.uid()) = 'technician' AND
  public.is_user_approved(auth.uid()) = true
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();