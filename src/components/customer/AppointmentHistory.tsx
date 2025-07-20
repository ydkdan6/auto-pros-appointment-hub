import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Car, FileText, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  time: string;
  vehicle: string;
  fault: string;
  reason: string;
  preferredTechnician: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  createdAt: string;
  assignedTechnician?: string;
  completedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  estimatedDuration?: number;
}

interface DatabaseAppointment {
  id: string;
  customer_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  fault_description: string;
  reason_description: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  technician_id: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  estimated_duration_hours: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields from profiles table
  customer_profile?: { full_name: string };
  technician_profile?: { full_name: string };
}

export const AppointmentHistory: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform database appointment to component format
  const transformAppointment = (dbAppointment: DatabaseAppointment): Appointment => {
    return {
      id: dbAppointment.id,
      customerId: dbAppointment.customer_id,
      customerName: dbAppointment.customer_profile?.full_name || 'Unknown Customer',
      date: dbAppointment.appointment_date,
      time: dbAppointment.appointment_time,
      vehicle: `${dbAppointment.vehicle_year} ${dbAppointment.vehicle_make} ${dbAppointment.vehicle_model}`,
      fault: dbAppointment.fault_description,
      reason: dbAppointment.reason_description,
      preferredTechnician: '', // This field doesn't exist in the new schema
      status: dbAppointment.status,
      createdAt: dbAppointment.created_at,
      assignedTechnician: dbAppointment.technician_profile?.full_name || undefined,
      completedAt: dbAppointment.status === 'completed' ? dbAppointment.updated_at : undefined,
      rejectionReason: dbAppointment.rejection_reason || undefined,
      adminNotes: dbAppointment.admin_notes || undefined,
      estimatedDuration: dbAppointment.estimated_duration_hours || undefined,
    };
  };

  const fetchAppointments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          *,
          customer_profile:profiles!appointments_customer_id_fkey(
            full_name
          ),
          technician_profile:profiles!appointments_technician_id_fkey(
            full_name
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const transformedAppointments = (data || []).map(transformAppointment);
      setAppointments(transformedAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "flex items-center space-x-1";
    
    switch (status) {
      case 'pending':
        return <Badge className={`${baseClasses} status-pending`}>
          {getStatusIcon(status)}
          <span>Pending</span>
        </Badge>;
      case 'approved':
        return <Badge className={`${baseClasses} status-approved`}>
          {getStatusIcon(status)}
          <span>Approved</span>
        </Badge>;
      case 'completed':
        return <Badge className={`${baseClasses} status-completed`}>
          {getStatusIcon(status)}
          <span>Completed</span>
        </Badge>;
      case 'rejected':
        return <Badge className={`${baseClasses} status-rejected`}>
          {getStatusIcon(status)}
          <span>Rejected</span>
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    // Handle time format from database (HH:mm:ss)
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Card className="card-workshop">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your appointments...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-workshop">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Appointments</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={fetchAppointments} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="card-workshop">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Appointments Yet</h3>
          <p className="text-muted-foreground text-center">
            You haven't booked any appointments yet. Click "Book Appointment" to schedule your first service.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="card-workshop">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>My Appointments</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchAppointments}
              className="ml-auto"
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">{appointment.vehicle}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(appointment.date)} at {formatTime(appointment.time)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Fault:</p>
                      <p className="text-sm text-muted-foreground">{appointment.fault}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                    </div>
                  </div>

                  {appointment.estimatedDuration && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-info" />
                      <p className="text-sm">
                        <span className="font-medium">Estimated Duration:</span> {appointment.estimatedDuration} hour{appointment.estimatedDuration !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {appointment.assignedTechnician && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <p className="text-sm">
                        <span className="font-medium">Assigned Technician:</span> {appointment.assignedTechnician}
                      </p>
                    </div>
                  )}

                  {appointment.adminNotes && (
                    <div className="bg-info/10 border border-info/20 rounded-md p-3">
                      <p className="text-sm font-medium text-info">Admin Notes:</p>
                      <p className="text-sm text-info/80">{appointment.adminNotes}</p>
                    </div>
                  )}

                  {appointment.rejectionReason && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                      <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                      <p className="text-sm text-destructive/80">{appointment.rejectionReason}</p>
                    </div>
                  )}

                  {appointment.completedAt && (
                    <div className="bg-success/10 border border-success/20 rounded-md p-3">
                      <p className="text-sm font-medium text-success">
                        Service completed on {formatDate(appointment.completedAt)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Requested: {formatDate(appointment.createdAt)}
                  </p>
                  
                  {appointment.status === 'pending' && (
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};