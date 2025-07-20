import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Mail,
  Phone,
  Calendar,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Technician {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  email?: string; // This will come from auth.users if needed
  assignedJobs?: number;
  completedJobs?: number;
}

interface Assignment {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  time: string;
  vehicle: string;
  fault: string;
  reason: string;
  status: string;
  assignedTechnician: string;
  tasks: string;
  estimatedDuration: string;
}

export const TechnicianManagement: React.FC = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechnicians();
    loadAssignments();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      
      // First, fetch technicians from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          phone,
          role,
          is_approved,
          created_at,
          updated_at
        `)
        .eq('role', 'technician')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching technicians:', profilesError);
        toast({
          title: "Error",
          description: "Failed to load technicians.",
          variant: "destructive"
        });
        return;
      }

      // Then fetch emails from auth.users for these technicians
      if (profilesData && profilesData.length > 0) {
        const userIds = profilesData.map(profile => profile.user_id);
        
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          console.warn('Could not fetch user emails:', usersError);
        }

        // Map emails to profiles
        const technicianData = profilesData.map(profile => {
          const userEmail = usersData?.users?.find(user => user.id === profile.user_id)?.email || '';
          return {
            ...profile,
            email: userEmail,
            assignedJobs: 0, // You can calculate this from your assignments table
            completedJobs: 0  // You can calculate this from your assignments table
          };
        });

        setTechnicians(technicianData);
      } else {
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = () => {
    // Load assignments from localStorage (you can replace this with Supabase query)
    const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const techAssignments = storedAppointments.filter((apt: Assignment) => 
      apt.assignedTechnician && apt.status !== 'completed'
    );
    setAssignments(techAssignments);
  };

  const handleApproveTechnician = async (technicianId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', technicianId);

      if (error) {
        console.error('Error approving technician:', error);
        toast({
          title: "Error",
          description: "Failed to approve technician.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      const updatedTechnicians = technicians.map(tech => {
        if (tech.id === technicianId) {
          return { ...tech, is_approved: true };
        }
        return tech;
      });
      
      setTechnicians(updatedTechnicians);
      
      toast({
        title: "Technician Approved",
        description: "The technician can now access their dashboard.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleRejectTechnician = async (technicianId: string) => {
    try {
      // You might want to set is_approved to false instead of deleting
      // or add a separate status field for rejected technicians
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', technicianId);

      if (error) {
        console.error('Error rejecting technician:', error);
        toast({
          title: "Error",
          description: "Failed to reject technician.",
          variant: "destructive"
        });
        return;
      }

      // Remove from local state or update based on your requirements
      const updatedTechnicians = technicians.map(tech => {
        if (tech.id === technicianId) {
          return { ...tech, is_approved: false };
        }
        return tech;
      });
      
      setTechnicians(updatedTechnicians);
      
      toast({
        title: "Technician Rejected",
        description: "The technician application has been rejected.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (isApproved: boolean) => {
    return isApproved ? (
      <Badge className="status-approved">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    ) : (
      <Badge className="status-pending">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAssignedJobsCount = (techName: string) => {
    return assignments.filter(assignment => assignment.assignedTechnician === techName).length;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="card-workshop">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading technicians...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Technician List */}
      <Card className="card-workshop">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Technician Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {technicians.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No technicians found.</p>
              </div>
            ) : (
              technicians.map((technician) => (
                <div 
                  key={technician.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/20 p-2 rounded-full">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{technician.full_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Joined: {formatDate(technician.created_at)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(technician.is_approved)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      {technician.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{technician.email}</span>
                        </div>
                      )}
                      {technician.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{technician.phone}</span>
                        </div>
                      )}
                    </div>

                    {technician.is_approved && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-sm">
                            Active Jobs: {getAssignedJobsCount(technician.full_name)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm">
                            Completed: {technician.completedJobs || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    {!technician.is_approved && (
                      <>
                        <Button 
                          onClick={() => handleApproveTechnician(technician.id)}
                          size="sm"
                          className="btn-workshop-success"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleRejectTechnician(technician.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card className="card-workshop">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Current Assignments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active assignments at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div 
                  key={assignment.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{assignment.customerName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {assignment.vehicle} • {formatDate(assignment.date)} at {assignment.time}
                      </p>
                    </div>
                    <Badge className="status-approved">
                      {assignment.assignedTechnician}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Fault:</span> {assignment.fault}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Tasks:</span> {assignment.tasks}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Duration:</span> {assignment.estimatedDuration}
                    </p>
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