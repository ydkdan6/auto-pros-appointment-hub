import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppointmentManagement } from './AppointmentManagement';
import { TechnicianManagement } from './TechnicianManagement';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Settings
} from 'lucide-react';

type TabType = 'overview' | 'appointments' | 'technicians';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: TrendingUp },
    { id: 'appointments' as TabType, label: 'Appointments', icon: Calendar },
    { id: 'technicians' as TabType, label: 'Technicians', icon: Users },
  ];

  // Mock stats - in real app, this would come from API
  const stats = {
    totalAppointments: 145,
    pendingApprovals: 8,
    completedToday: 12,
    activeTechnicians: 6
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <AppointmentManagement />;
      case 'technicians':
        return <TechnicianManagement />;
      default:
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-workshop">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card className="card-workshop">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{stats.pendingApprovals}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card className="card-workshop">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{stats.completedToday}</div>
                  <p className="text-xs text-muted-foreground">Services finished</p>
                </CardContent>
              </Card>

              <Card className="card-workshop">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Technicians</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeTechnicians}</div>
                  <p className="text-xs text-muted-foreground">On duty today</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="card-workshop">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => setActiveTab('appointments')}
                    className="btn-workshop-primary justify-start h-auto p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Manage Appointments</div>
                        <div className="text-sm opacity-80">Review and approve pending requests</div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => setActiveTab('technicians')}
                    variant="outline"
                    className="justify-start h-auto p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Manage Team</div>
                        <div className="text-sm opacity-70">Assign tasks and manage technicians</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="card-workshop">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Mike completed brake service for Toyota Camry</span>
                    <span className="text-muted-foreground">2 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>New appointment request from Sarah Wilson</span>
                    <span className="text-muted-foreground">4 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Users className="h-4 w-4 text-accent" />
                    <span>David Chen marked transmission repair as in-progress</span>
                    <span className="text-muted-foreground">6 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="fade-in">
        {renderContent()}
      </div>
    </div>
  );
};