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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Car, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User,
  Settings,
  Loader2,
  RefreshCw
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
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  createdAt: string;
  assignedTechnician?: string;
  technicianId?: string;
  adminNotes?: string;
  estimatedDuration?: number;
  rejectionReason?: string;
  tasks?: Array<{
    id: string;
    description: string;
    estimatedDuration: number;
    status: string;
  }>;
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
  customer_profile?: { full_name: string };
  technician_profile?: { full_name: string };
  tasks?: Array<{
    id: string;
    task_description: string;
    estimated_duration_hours: number;
    status: string;
  }>;
}

interface Technician {
  user_id: string;
  full_name: string;
}

export const AppointmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assignmentData, setAssignmentData] = useState({
    technician: '',
    tasks: '',
    duration: '',
    adminNotes: ''
  });

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
      status: dbAppointment.status,
      createdAt: dbAppointment.created_at,
      assignedTechnician: dbAppointment.technician_profile?.full_name,
      technicianId: dbAppointment.technician_id || undefined,
      adminNotes: dbAppointment.admin_notes || undefined,
      estimatedDuration: dbAppointment.estimated_duration_hours || undefined,
      rejectionReason: dbAppointment.rejection_reason || undefined,
      tasks: dbAppointment.tasks?.map(task => ({
        id: task.id,
        description: task.task_description,
        estimatedDuration: task.estimated_duration_hours,
        status: task.status
      })) || []
    };
  };

  const fetchAppointments = async () => {
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
          ),
          tasks(
            id,
            task_description,
            estimated_duration_hours,
            status
          )
        `)
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

  const fetchTechnicians = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('role', 'technician')
        .eq('is_approved', true);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setTechnicians(data || []);
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchTechnicians();
  }, []);

  const updateAppointmentStatus = async (
    appointmentId: string, 
    status: 'pending' | 'approved' | 'completed' | 'rejected',
    additionalData?: any
  ) => {
    try {
      const updateData: any = { status };
      
      if (additionalData) {
        if (additionalData.technicianId) updateData.technician_id = additionalData.technicianId;
        if (additionalData.adminNotes) updateData.admin_notes = additionalData.adminNotes;
        if (additionalData.rejectionReason) updateData.rejection_reason = additionalData.rejectionReason;
        if (additionalData.estimatedDuration) updateData.estimated_duration_hours = additionalData.estimatedDuration;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh appointments list
      await fetchAppointments();
      
    } catch (err) {
      console.error('Error updating appointment:', err);
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async (appointment: Appointment) => {
    await updateAppointmentStatus(appointment.id, 'approved');
    toast({
      title: "Appointment Approved",
      description: `${appointment.customerName}'s appointment has been approved.`,
    });
  };

  const handleReject = async (appointment: Appointment) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      await updateAppointmentStatus(appointment.id, 'rejected', { rejectionReason: reason });
      toast({
        title: "Appointment Rejected",
        description: `${appointment.customerName}'s appointment has been rejected.`,
        variant: "destructive"
      });
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedAppointment || !assignmentData.technician || !assignmentData.tasks || !assignmentData.duration) {
      toast({
        title: "Error",
        description: "Please fill in all assignment fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedTech = technicians.find(t => t.user_id === assignmentData.technician);
      const estimatedHours = parseFloat(assignmentData.duration);

      // Update appointment with technician assignment
      await updateAppointmentStatus(selectedAppointment.id, 'approved', {
        technicianId: assignmentData.technician,
        adminNotes: assignmentData.adminNotes,
        estimatedDuration: estimatedHours
      });

      // Create task for the technician
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          appointment_id: selectedAppointment.id,
          technician_id: assignmentData.technician,
          task_description: assignmentData.tasks,
          estimated_duration_hours: estimatedHours,
          status: 'assigned'
        });

      if (taskError) throw taskError;

      toast({
        title: "Technician Assigned",
        description: `${selectedTech?.full_name} has been assigned to this appointment.`,
      });

      setAssignDialogOpen(false);
      setAssignmentData({ technician: '', tasks: '', duration: '', adminNotes: '' });
      setSelectedAppointment(null);

    } catch (err) {
      console.error('Error assigning technician:', err);
      toast({
        title: "Error",
        description: "Failed to assign technician",
        variant: "destructive"
      });
    }
  };

  const handleComplete = async (appointment: Appointment) => {
    try {
      // Update appointment status
      await updateAppointmentStatus(appointment.id, 'completed');

      // Update all associated tasks to completed
      if (appointment.tasks && appointment.tasks.length > 0) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ status: 'completed' })
          .eq('appointment_id', appointment.id);

        if (taskError) throw taskError;
      }

      toast({
        title: "Service Completed",
        description: `${appointment.customerName} has been notified of completion.`,
      });
    } catch (err) {
      console.error('Error completing appointment:', err);
      toast({
        title: "Error",
        description: "Failed to complete appointment",
        variant: "destructive"
      });
    }
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

  const formatTime = (timeString: string) => {
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
          <p className="text-muted-foreground">Loading appointments...</p>
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
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-workshop">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Appointment Management</span>
            </div>
            <Button onClick={fetchAppointments} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
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
                          {formatDate(appointment.date)} at {formatTime(appointment.time)}
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

                  {appointment.tasks && appointment.tasks.length > 0 && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-3">
                      <p className="text-sm font-medium mb-2">Assigned Tasks:</p>
                      {appointment.tasks.map((task, index) => (
                        <div key={task.id} className="mb-2 last:mb-0">
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-primary">
                              Duration: {task.estimatedDuration}h
                            </p>
                            <Badge variant={task.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {appointment.adminNotes && (
                    <div className="bg-info/10 border border-info/20 rounded-md p-3 mb-3">
                      <p className="text-sm font-medium">Admin Notes:</p>
                      <p className="text-sm text-muted-foreground">{appointment.adminNotes}</p>
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
                                        <SelectItem key={tech.user_id} value={tech.user_id}>
                                          {tech.full_name}
                                        </SelectItem>
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
                                  <Label>Estimated Duration (Days)</Label>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    placeholder="e.g., 2, 1.5, 3"
                                    value={assignmentData.duration}
                                    onChange={(e) => setAssignmentData(prev => ({...prev, duration: e.target.value}))}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Admin Notes (Optional)</Label>
                                  <Textarea
                                    placeholder="Any additional notes for the technician..."
                                    value={assignmentData.adminNotes}
                                    onChange={(e) => setAssignmentData(prev => ({...prev, adminNotes: e.target.value}))}
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

                      {appointment.status === 'approved' && (
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