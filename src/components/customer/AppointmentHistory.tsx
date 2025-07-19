import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Car, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
}

export const AppointmentHistory: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    // Load appointments from localStorage (in real app, this would be an API call)
    const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const userAppointments = storedAppointments.filter((apt: Appointment) => apt.customerId === user?.id);
    setAppointments(userAppointments.sort((a: Appointment, b: Appointment) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
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
                        {formatDate(appointment.date)} at {appointment.time}
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

                  {appointment.assignedTechnician && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <p className="text-sm">
                        <span className="font-medium">Assigned Technician:</span> {appointment.assignedTechnician}
                      </p>
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