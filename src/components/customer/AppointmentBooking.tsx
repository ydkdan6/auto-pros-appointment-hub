import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar, Car, FileText, Clock } from 'lucide-react';

interface AppointmentBookingProps {
  onSuccess: () => void;
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ onSuccess }) => {
  const { user, profile } = useAuth();
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

  const technicians = [
  ];

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

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    try {
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
          appointment_time: formData.time,
          status: 'pending'
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to book appointment. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been submitted and is pending approval.",
      });

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
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
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
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Preferred Time *</Label>
            <Select value={formData.time} onValueChange={(value) => handleInputChange('time', value)}>
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
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleYear">Year *</Label>
              <Input
                id="vehicleYear"
                placeholder="e.g., 2020"
                value={formData.vehicleYear}
                onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
                className="bg-input border-border"
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
          <Select value={formData.preferredTechnician} onValueChange={(value) => handleInputChange('preferredTechnician', value)}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Choose a technician" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((tech) => (
                <SelectItem key={tech} value={tech}>{tech}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          className="btn-workshop-primary w-full"
        >
          <Clock className="mr-2 h-4 w-4" />
          Submit Appointment Request
        </Button>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Your appointment request will be reviewed by our team. 
            You'll receive a confirmation email once approved, or we'll contact you if we need to reschedule.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};