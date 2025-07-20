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
  User,
  Loader2
} from 'lucide-react';

interface Task {
  id: string;
  appointment_id: string;
  technician_id: string;
  task_description: string;
  estimated_duration_hours: number;
  status: 'assigned' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  // Joined data from appointments and profiles tables
  appointment: {
    id: string;
    customer_id: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    fault_description: string;
    reason_description: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    admin_notes: string | null;
    estimated_duration_hours: number | null;
    // Customer profile data
    customer: {
      full_name: string;
      phone: string | null;
    };
  };
}

export const TechnicianDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks for the current technician
  const fetchTasks = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Debug: Log the URL being called
      const apiUrl = `/api/technicians/${user.id}/tasks`;
      console.log('Fetching tasks from:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`, // Adjust based on your auth setup
          'Content-Type': 'application/json'
        }
      });

      // Debug: Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const htmlContent = await response.text();
        console.error('Received HTML instead of JSON:', htmlContent.substring(0, 200));
        throw new Error(`API returned HTML instead of JSON. Status: ${response.status}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error (${response.status}): ${errorText || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Tasks data received:', data);
      
      setTasks(data.sort((a: Task, b: Task) => 
        new Date(a.appointment.appointment_date).getTime() - new Date(b.appointment.appointment_date).getTime()
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
      
      // If it's a network error, provide more helpful message
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Could not connect to the server. Check if the API is running.');
      }

      // TEMPORARY: Use mock data if API is not available (remove in production)
      console.warn('Using mock data due to API error');
      setTasks(getMockTasks());
      setError(null); // Clear error when using mock data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user?.id]);

  // Temporary mock data for testing (remove when API is ready)
  const getMockTasks = (): Task[] => {
    const mockTasks: Task[] = [
      {
        id: '1',
        appointment_id: 'apt-1',
        technician_id: user?.id || '',
        task_description: 'Perform brake inspection and replace brake pads if necessary',
        estimated_duration_hours: 2,
        status: 'assigned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        appointment: {
          id: 'apt-1',
          customer_id: 'cust-1',
          vehicle_make: 'Toyota',
          vehicle_model: 'Camry',
          vehicle_year: 2020,
          fault_description: 'Brakes making squealing noise',
          reason_description: 'Safety concern - brakes feel less responsive than usual',
          appointment_date: '2024-07-22',
          appointment_time: '09:00:00',
          status: 'approved',
          admin_notes: null,
          estimated_duration_hours: 2,
          customer: {
            full_name: 'John Doe',
            phone: '+1-555-0123'
          }
        }
      },
      {
        id: '2',
        appointment_id: 'apt-2',
        technician_id: user?.id || '',
        task_description: 'Engine diagnostic and oil change',
        estimated_duration_hours: 1,
        status: 'in_progress',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        appointment: {
          id: 'apt-2',
          customer_id: 'cust-2',
          vehicle_make: 'Honda',
          vehicle_model: 'Civic',
          vehicle_year: 2019,
          fault_description: 'Check engine light is on',
          reason_description: 'Regular maintenance due',
          appointment_date: '2024-07-21',
          appointment_time: '14:30:00',
          status: 'approved',
          admin_notes: 'Priority job',
          estimated_duration_hours: 1,
          customer: {
            full_name: 'Jane Smith',
            phone: '+1-555-0456'
          }
        }
      }
    ];
    return mockTasks;
  };
  const updateTaskStatus = async (taskId: string, newStatus: 'assigned' | 'in_progress' | 'completed') => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const updatedTask = await response.json();

      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, updated_at: updatedTask.updated_at }
            : task
        )
      );

      return updatedTask;
    } catch (err) {
      console.error('Error updating task status:', err);
      throw err;
    }
  };

  const handleStartJob = async (task: Task) => {
    try {
      await updateTaskStatus(task.id, 'in_progress');
      toast({
        title: "Job Started",
        description: `Started working on ${task.appointment.customer.full_name}'s ${task.appointment.vehicle_year} ${task.appointment.vehicle_make} ${task.appointment.vehicle_model}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start the job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCompleteJob = async (task: Task) => {
    try {
      await updateTaskStatus(task.id, 'completed');
      toast({
        title: "Job Completed",
        description: `${task.appointment.customer.full_name}'s service has been marked as complete.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to complete the job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return (
          <Badge className="status-approved">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ready to Start
          </Badge>
        );
      case 'in_progress':
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
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'assigned').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchTasks} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

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
              <p className="text-muted-foreground">Here are your assigned tasks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-workshop">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
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

      {/* Tasks List */}
      <Card className="card-workshop">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>My Assigned Tasks</span>
            </CardTitle>
            <Button 
              onClick={fetchTasks} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-2 mt-4">
            {['all', 'assigned', 'in_progress', 'completed'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filterOption === 'assigned' ? 'Ready to Start' : 
                 filterOption.charAt(0).toUpperCase() + filterOption.slice(1).replace('_', ' ')}
                {filterOption === 'all' && ` (${tasks.length})`}
                {filterOption !== 'all' && ` (${tasks.filter(t => t.status === filterOption).length})`}
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "No tasks assigned yet. Check back later for new assignments." 
                  : `No tasks found for selected filter.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-semibold">{task.appointment.customer.full_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(task.appointment.appointment_date)} at {task.appointment.appointment_time}
                        </p>
                        {task.appointment.customer.phone && (
                          <p className="text-xs text-muted-foreground">
                            📞 {task.appointment.customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Vehicle:</p>
                          <p className="text-sm text-muted-foreground">
                            {task.appointment.vehicle_year} {task.appointment.vehicle_make} {task.appointment.vehicle_model}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Customer's Fault Description:</p>
                          <p className="text-sm text-muted-foreground">{task.appointment.fault_description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Customer's Reason:</p>
                          <p className="text-sm text-muted-foreground">{task.appointment.reason_description}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Wrench className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Estimated Duration:</p>
                          <p className="text-sm text-primary">{task.estimated_duration_hours} hours</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Description */}
                  <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-3">
                    <p className="text-sm font-medium mb-1">Task Description:</p>
                    <p className="text-sm text-muted-foreground">{task.task_description}</p>
                  </div>

                  {/* Progress Info */}
                  {task.status === 'in_progress' && (
                    <div className="bg-accent/10 border border-accent/20 rounded-md p-3 mb-3">
                      <p className="text-sm">
                        <span className="font-medium">Started:</span> {formatDateTime(task.updated_at)}
                      </p>
                    </div>
                  )}

                  {task.status === 'completed' && (
                    <div className="bg-success/10 border border-success/20 rounded-md p-3 mb-3">
                      <p className="text-sm">
                        <span className="font-medium">Completed:</span> {formatDateTime(task.updated_at)}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Assigned: {formatDate(task.created_at)}
                    </p>
                    
                    <div className="flex space-x-2">
                      {task.status === 'assigned' && (
                        <Button 
                          onClick={() => handleStartJob(task)}
                          size="sm"
                          className="btn-workshop-primary"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Start Task
                        </Button>
                      )}

                      {task.status === 'in_progress' && (
                        <Button 
                          onClick={() => handleCompleteJob(task)}
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