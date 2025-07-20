import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  Wrench, 
  Calendar, 
  Car, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';

interface Assignment {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  time: string;
  vehicle: string;
  fault: string;
  reason: string;
  status: 'approved' | 'in-progress' | 'completed';
  assignedTechnician: string;
  tasks: string;
  estimatedDuration: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export const TechnicianDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Load assignments from localStorage (in real app, this would be an API call)
    const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const techAssignments = storedAppointments.filter((apt: Assignment) => 
      apt.assignedTechnician === profile?.full_name
    );
    setAssignments(techAssignments.sort((a: Assignment, b: Assignment) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
  }, [profile?.full_name]);

  const updateAssignmentStatus = (assignmentId: string, status: string, data?: any) => {
    const updatedAssignments = assignments.map(assignment => {
      if (assignment.id === assignmentId) {
        return { ...assignment, status, ...data };
      }
      return assignment;
    });
    
    setAssignments(updatedAssignments);
    
    // Update the main appointments storage
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updatedAllAppointments = allAppointments.map((apt: Assignment) => {
      if (apt.id === assignmentId) {
        return { ...apt, status, ...data };
      }
      return apt;
    });
    localStorage.setItem('appointments', JSON.stringify(updatedAllAppointments));
  };

  const handleStartJob = (assignment: Assignment) => {
    updateAssignmentStatus(assignment.id, 'in-progress', { 
      startedAt: new Date().toISOString() 
    });
    toast({
      title: "Job Started",
      description: `Started working on ${assignment.customerName}'s ${assignment.vehicle}`,
    });
  };

  const handleCompleteJob = (assignment: Assignment) => {
    updateAssignmentStatus(assignment.id, 'completed', { 
      completedAt: new Date().toISOString() 
    });
    toast({
      title: "Job Completed",
      description: `${assignment.customerName}'s service has been marked as complete.`,
    });
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="status-approved">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ready to Start
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="status-pending">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="status-completed">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate stats
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'approved').length,
    inProgress: assignments.filter(a => a.status === 'in-progress').length,
    completed: assignments.filter(a => a.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="card-workshop">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-3 rounded-lg">
              <Wrench className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome, {profile?.full_name || user?.email}!</h2>
              <p className="text-muted-foreground">Here are your assigned jobs and tasks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-workshop">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="card-workshop">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Start</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="card-workshop">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card className="card-workshop">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card className="card-workshop">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>My Assigned Jobs</span>
          </CardTitle>
          
          {/* Filter Tabs */}
          <div className="flex space-x-2 mt-4">
            {['all', 'approved', 'in-progress', 'completed'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filterOption === 'approved' ? 'Ready to Start' : 
                 filterOption.charAt(0).toUpperCase() + filterOption.slice(1).replace('-', ' ')}
                {filterOption === 'all' && ` (${assignments.length})`}
                {filterOption !== 'all' && ` (${assignments.filter(a => a.status === filterOption).length})`}
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "No jobs assigned yet. Check back later for new assignments." 
                  : `No jobs found for selected filter.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <div 
                  key={assignment.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-semibold">{assignment.customerName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(assignment.date)} at {assignment.time}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Vehicle:</p>
                          <p className="text-sm text-muted-foreground">{assignment.vehicle}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Customer's Fault Description:</p>
                          <p className="text-sm text-muted-foreground">{assignment.fault}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Customer's Reason:</p>
                          <p className="text-sm text-muted-foreground">{assignment.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Wrench className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Estimated Duration:</p>
                          <p className="text-sm text-primary">{assignment.estimatedDuration}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Tasks */}
                  <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-3">
                    <p className="text-sm font-medium mb-1">Assigned Tasks:</p>
                    <p className="text-sm text-muted-foreground">{assignment.tasks}</p>
                  </div>

                  {/* Progress Info */}
                  {assignment.startedAt && (
                    <div className="bg-accent/10 border border-accent/20 rounded-md p-3 mb-3">
                      <p className="text-sm">
                        <span className="font-medium">Started:</span> {formatDateTime(assignment.startedAt)}
                      </p>
                    </div>
                  )}

                  {assignment.completedAt && (
                    <div className="bg-success/10 border border-success/20 rounded-md p-3 mb-3">
                      <p className="text-sm">
                        <span className="font-medium">Completed:</span> {formatDateTime(assignment.completedAt)}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Assigned: {formatDate(assignment.createdAt)}
                    </p>
                    
                    <div className="flex space-x-2">
                      {assignment.status === 'approved' && (
                        <Button 
                          onClick={() => handleStartJob(assignment)}
                          size="sm"
                          className="btn-workshop-primary"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Start Job
                        </Button>
                      )}

                      {assignment.status === 'in-progress' && (
                        <Button 
                          onClick={() => handleCompleteJob(assignment)}
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