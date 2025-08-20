import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar, Car, FileText, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Technician {
  user_id: string;
  full_name: string;
}

interface AppointmentBookingProps {
  onSuccess: () => void;
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ onSuccess }) => {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(true);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    fault: '',
    reason: '',
    preferredTechnician: ''
  });

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  // Fetch technicians on component mount
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('role', 'technician')
          .eq('is_approved', true)
          .order('full_name', { ascending: true });

        if (error) {
          console.error('Error fetching technicians:', error);
          toast({
            title: "Warning",
            description: "Could not load technicians list",
            variant: "destructive"
          });
        } else {
          setTechnicians(data || []);
        }
      } catch (error) {
        console.error('Unexpected error fetching technicians:', error);
      } finally {
        setIsLoadingTechnicians(false);
      }
    };

    fetchTechnicians();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.date || !formData.time || !formData.vehicleMake || 
        !formData.vehicleModel || !formData.vehicleYear || 
        !formData.fault || !formData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return false;
    }

    if (formData.fault.length > 200) {
      toast({
        title: "Error",
        description: "Vehicle fault description must be 200 characters or less",
        variant: "destructive"
      });
      return false;
    }

    if (formData.reason.length > 500) {
      toast({
        title: "Error",
        description: "Appointment reason must be 500 characters or less",
        variant: "destructive"
      });
      return false;
    }

    // Validate year is a number and reasonable
    const year = parseInt(formData.vehicleYear);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      toast({
        title: "Error",
        description: "Please enter a valid vehicle year",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const convertTimeToDBFormat = (timeString: string): string => {
    // Convert "8:00 AM" format to "08:00:00" format
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const checkTimeSlotAvailability = async (date: string, time: string): Promise<boolean> => {
    const dbTime = convertTimeToDBFormat(time);
    
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('id')
      .eq('appointment_date', date)
      .eq('appointment_time', dbTime)
      .in('status', ['approved', 'pending']);

    if (error) {
      console.error('Error checking availability:', error);
      throw error;
    }

    return existingAppointments.length === 0;
  };

  const calculateDelayedTime = (originalTime: string): string => {
    const dbTime = convertTimeToDBFormat(originalTime);
    const [hours, minutes] = dbTime.split(':').map(Number);
    
    // Add 30 minutes
    let newMinutes = minutes + 30;
    let newHours = hours;
    
    if (newMinutes >= 60) {
      newMinutes -= 60;
      newHours += 1;
    }
    
    // Convert back to display format
    const period = newHours >= 12 ? 'PM' : 'AM';
    let displayHour = newHours > 12 ? newHours - 12 : newHours;
    if (displayHour === 0) displayHour = 12;
    
    return `${displayHour}:${newMinutes.toString().padStart(2, '0')} ${period}`;
  };

  const findAvailableTimeSlot = async (date: string, originalTime: string): Promise<{ time: string; isOriginal: boolean }> => {
    let currentTime = originalTime;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop, max 5 hours of delays

    while (attempts < maxAttempts) {
      const isAvailable = await checkTimeSlotAvailability(date, currentTime);
      
      if (isAvailable) {
        return {
          time: currentTime,
          isOriginal: attempts === 0
        };
      }
      
      // Time slot is taken, try 30 minutes later
      currentTime = calculateDelayedTime(currentTime);
      attempts++;
      
      // Check if we've gone beyond business hours (after 5:00 PM)
      const dbTime = convertTimeToDBFormat(currentTime);
      const [hours] = dbTime.split(':').map(Number);
      
      if (hours >= 17) { // 5:00 PM or later
        throw new Error('No available time slots for this date. Please try a different date.');
      }
    }
    
    throw new Error('Unable to find an available time slot. Please try a different date.');
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Check if the preferred time slot is available
      const isAvailable = await checkTimeSlotAvailability(formData.date, formData.time);
      
      let finalTime = formData.time;
      let finalStatus = 'approved';
      let adminNotes = '';

      if (!isAvailable) {
        // Time slot is taken, calculate delayed time (30 minutes later)
        finalTime = calculateDelayedTime(formData.time);
        adminNotes = `Original requested time: ${formData.time}. Automatically rescheduled due to time conflict.`;
        
        toast({
          title: "Time Slot Conflict",
          description: `Your preferred time ${formData.time} was unavailable. Your appointment has been automatically rescheduled to ${finalTime}.`,
          variant: "default"
        });
      }

      const dbTime = convertTimeToDBFormat(finalTime);
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          customer_id: user.id,
          vehicle_make: formData.vehicleMake,
          vehicle_model: formData.vehicleModel,
          vehicle_year: parseInt(formData.vehicleYear),
          fault_description: formData.fault,
          reason_description: formData.reason,
          appointment_date: formData.date,
          appointment_time: dbTime,
          status: finalStatus,
          admin_notes: adminNotes || null
        });

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Error",
          description: "Failed to book appointment. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (isAvailable) {
        toast({
          title: "Appointment Confirmed!",
          description: `Your appointment has been automatically approved for ${formData.date} at ${finalTime}.`,
        });
      } else {
        toast({
          title: "Appointment Rescheduled & Confirmed!",
          description: `Your appointment has been confirmed for ${formData.date} at ${finalTime}.`,
        });
      }

      // Reset form
      setFormData({
        date: '',
        time: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        fault: '',
        reason: '',
        preferredTechnician: ''
      });

      onSuccess();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="card-workshop">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Book New Appointment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Information Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Auto-Approval System:</strong> Your appointment will be automatically approved if the time slot is available. 
            If your preferred time is taken, we'll automatically reschedule you to 30 minutes later and confirm immediately.
          </AlertDescription>
        </Alert>

        {/* Date and Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Preferred Date *</Label>
            <Input
              id="date"
              type="date"
              min={today}
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="bg-input border-border"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Preferred Time *</Label>
            <Select value={formData.time} onValueChange={(value) => handleInputChange('time', value)} disabled={isSubmitting}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Car className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Vehicle Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleMake">Make *</Label>
              <Input
                id="vehicleMake"
                placeholder="e.g., Toyota"
                value={formData.vehicleMake}
                onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                className="bg-input border-border"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Model *</Label>
              <Input
                id="vehicleModel"
                placeholder="e.g., Camry"
                value={formData.vehicleModel}
                onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                className="bg-input border-border"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleYear">Year *</Label>
              <Input
                id="vehicleYear"
                placeholder="e.g., 2020"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 2}
                value={formData.vehicleYear}
                onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
                className="bg-input border-border"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Service Details</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fault">Vehicle Fault * (max 200 characters)</Label>
              <Input
                id="fault"
                placeholder="e.g., brake failure, engine noise, transmission issue"
                value={formData.fault}
                onChange={(e) => handleInputChange('fault', e.target.value)}
                maxLength={200}
                className="bg-input border-border"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {formData.fault.length}/200 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Appointment * (max 500 characters)</Label>
              <Textarea
                id="reason"
                placeholder="Please describe the symptoms and when they occur (e.g., car stops abruptly when braking, strange noise when turning)"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                maxLength={500}
                rows={4}
                className="bg-input border-border"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {formData.reason.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Technician Preference */}
        <div className="space-y-2">
          <Label htmlFor="technician">Preferred Technician (Optional)</Label>
          {isLoadingTechnicians ? (
            <div className="bg-input border-border rounded-md px-3 py-2 text-sm text-muted-foreground">
              Loading technicians...
            </div>
          ) : technicians.length === 0 ? (
            <div className="bg-input border-border rounded-md px-3 py-2 text-sm text-muted-foreground">
              No technicians available
            </div>
          ) : (
            <Select 
              value={formData.preferredTechnician} 
              onValueChange={(value) => handleInputChange('preferredTechnician', value)} 
              disabled={isSubmitting}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Choose a technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.user_id} value={tech.user_id}>
                    {tech.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {technicians.length === 0 && !isLoadingTechnicians && (
            <p className="text-xs text-muted-foreground">
              No approved technicians found. You can still book an appointment and a technician will be assigned later.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          className="btn-workshop-primary w-full"
          disabled={isSubmitting}
        >
          <Clock className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Processing...' : 'Submit Appointment Request'}
        </Button>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>How it works:</strong> Our smart scheduling system will instantly approve your appointment if the time slot is available. 
            If there's a conflict, we'll automatically reschedule you 30 minutes later and confirm immediately - no waiting for manual approval!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};