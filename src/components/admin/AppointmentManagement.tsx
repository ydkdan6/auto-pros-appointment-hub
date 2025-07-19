import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Car, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User,
  Settings
} from 'lucide-react';

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
  tasks?: string;
  estimatedDuration?: string;
  completedAt?: string;
  rejectionReason?: string;
}

export const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const technicians = [
    'Mike Johnson',
    'Sarah Wilson', 
    'David Chen',
    'Emily Rodriguez',
    'Alex Thompson'
  ];

  const [assignmentData, setAssignmentData] = useState({
    technician: '',
    tasks: '',
    duration: ''
  });

  useEffect(() => {
    // Load appointments from localStorage (in real app, this would be an API call)
    const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    setAppointments(storedAppointments.sort((a: Appointment, b: Appointment) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  }, []);

  const updateAppointmentStatus = (appointmentId: string, status: string, data?: any) => {
    const updatedAppointments = appointments.map(apt => {
      if (apt.id === appointmentId) {
        return { ...apt, status, ...data };
      }
      return apt;
    });
    
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
  };

  const handleApprove = (appointment: Appointment) => {
    updateAppointmentStatus(appointment.id, 'approved');
    toast({
      title: "Appointment Approved",
      description: `${appointment.customerName}'s appointment has been approved.`,
    });
  };

  const handleReject = (appointment: Appointment) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      updateAppointmentStatus(appointment.id, 'rejected', { rejectionReason: reason });
      toast({
        title: "Appointment Rejected",
        description: `${appointment.customerName}'s appointment has been rejected.`,
        variant: "destructive"
      });
    }
  };

  const handleAssignTechnician = () => {
    if (!selectedAppointment || !assignmentData.technician || !assignmentData.tasks || !assignmentData.duration) {
      toast({
        title: "Error",
        description: "Please fill in all assignment fields",
        variant: "destructive"
      });
      return;
    }

    updateAppointmentStatus(selectedAppointment.id, 'approved', {
      assignedTechnician: assignmentData.technician,
      tasks: assignmentData.tasks,
      estimatedDuration: assignmentData.duration
    });

    toast({
      title: "Technician Assigned",
      description: `${assignmentData.technician} has been assigned to this appointment.`,
    });

    setAssignDialogOpen(false);
    setAssignmentData({ technician: '', tasks: '', duration: '' });
    setSelectedAppointment(null);
  };

  const handleComplete = (appointment: Appointment) => {
    updateAppointmentStatus(appointment.id, 'completed', { 
      completedAt: new Date().toISOString() 
    });
    toast({
      title: "Service Completed",
      description: `${appointment.customerName} has been notified of completion.`,
    });
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="status-pending">Pending</Badge>;
      case 'approved':
        return <Badge className="status-approved">Approved</Badge>;
      case 'completed':
        return <Badge className="status-completed">Completed</Badge>;
      case 'rejected':
        return <Badge className="status-rejected">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="card-workshop">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Appointment Management</span>
          </CardTitle>
          
          {/* Filter Tabs */}
          <div className="flex space-x-2 mt-4">
            {['all', 'pending', 'approved', 'completed', 'rejected'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                {filterOption === 'all' && ` (${appointments.length})`}
                {filterOption !== 'all' && ` (${appointments.filter(a => a.status === filterOption).length})`}
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No appointments found for selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-semibold">{appointment.customerName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(appointment.date)} at {appointment.time}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Vehicle:</p>
                          <p className="text-sm text-muted-foreground">{appointment.vehicle}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Fault:</p>
                          <p className="text-sm text-muted-foreground">{appointment.fault}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
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
                            <span className="font-medium">Assigned:</span> {appointment.assignedTechnician}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {appointment.tasks && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-3">
                      <p className="text-sm font-medium">Assigned Tasks:</p>
                      <p className="text-sm text-muted-foreground">{appointment.tasks}</p>
                      {appointment.estimatedDuration && (
                        <p className="text-xs text-primary mt-1">
                          Estimated Duration: {appointment.estimatedDuration}
                        </p>
                      )}
                    </div>
                  )}

                  {appointment.rejectionReason && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-3">
                      <p className="text-sm font-medium text-destructive">Rejection Reason:</p>
                      <p className="text-sm text-destructive/80">{appointment.rejectionReason}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Requested: {formatDate(appointment.createdAt)}
                    </p>
                    
                    <div className="flex space-x-2">
                      {appointment.status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => handleApprove(appointment)}
                            size="sm"
                            className="btn-workshop-success"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                onClick={() => setSelectedAppointment(appointment)}
                                size="sm"
                                className="btn-workshop-primary"
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Assign
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Technician</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Technician</Label>
                                  <Select 
                                    value={assignmentData.technician} 
                                    onValueChange={(value) => setAssignmentData(prev => ({...prev, technician: value}))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select technician" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {technicians.map((tech) => (
                                        <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Tasks & Instructions</Label>
                                  <Textarea
                                    placeholder="Describe the specific tasks based on the fault and reason..."
                                    value={assignmentData.tasks}
                                    onChange={(e) => setAssignmentData(prev => ({...prev, tasks: e.target.value}))}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Estimated Duration</Label>
                                  <Input
                                    placeholder="e.g., 2 hours, 1.5 hours, 45 minutes"
                                    value={assignmentData.duration}
                                    onChange={(e) => setAssignmentData(prev => ({...prev, duration: e.target.value}))}
                                  />
                                </div>

                                <Button onClick={handleAssignTechnician} className="w-full">
                                  Assign Technician
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            onClick={() => handleReject(appointment)}
                            size="sm"
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {appointment.status === 'approved' && !appointment.completedAt && (
                        <Button 
                          onClick={() => handleComplete(appointment)}
                          size="sm"
                          className="btn-workshop-success"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};