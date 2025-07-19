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

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isApproved: boolean;
  joinedAt: string;
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

  useEffect(() => {
    // Load technicians from localStorage (in real app, this would be an API call)
    const mockTechnicians: Technician[] = [
      {
        id: '2',
        name: 'Mike Johnson',
        email: 'mike@autopro.com',
        phone: '+1234567891',
        role: 'technician',
        isApproved: true,
        joinedAt: '2024-01-15',
        assignedJobs: 3,
        completedJobs: 47
      },
      {
        id: '4',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        phone: '+1234567893',
        role: 'technician',
        isApproved: true,
        joinedAt: '2024-02-20',
        assignedJobs: 2,
        completedJobs: 32
      },
      {
        id: '5',
        name: 'David Chen',
        email: 'david.chen@example.com',
        phone: '+1234567894',
        role: 'technician',
        isApproved: false,
        joinedAt: '2024-03-10',
        assignedJobs: 0,
        completedJobs: 0
      },
      {
        id: '6',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        phone: '+1234567895',
        role: 'technician',
        isApproved: true,
        joinedAt: '2024-01-05',
        assignedJobs: 4,
        completedJobs: 56
      }
    ];

    setTechnicians(mockTechnicians);

    // Load assignments
    const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const techAssignments = storedAppointments.filter((apt: Assignment) => 
      apt.assignedTechnician && apt.status !== 'completed'
    );
    setAssignments(techAssignments);
  }, []);

  const handleApproveTechnician = (technicianId: string) => {
    const updatedTechnicians = technicians.map(tech => {
      if (tech.id === technicianId) {
        return { ...tech, isApproved: true };
      }
      return tech;
    });
    
    setTechnicians(updatedTechnicians);
    
    toast({
      title: "Technician Approved",
      description: "The technician can now access their dashboard.",
    });
  };

  const handleRejectTechnician = (technicianId: string) => {
    const updatedTechnicians = technicians.filter(tech => tech.id !== technicianId);
    setTechnicians(updatedTechnicians);
    
    toast({
      title: "Technician Rejected",
      description: "The technician application has been rejected.",
      variant: "destructive"
    });
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
            {technicians.map((technician) => (
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
                      <h4 className="font-semibold">{technician.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Joined: {formatDate(technician.joinedAt)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(technician.isApproved)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{technician.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{technician.phone}</span>
                    </div>
                  </div>

                  {technician.isApproved && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Active Jobs: {getAssignedJobsCount(technician.name)}
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
                  {!technician.isApproved && (
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
            ))}
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