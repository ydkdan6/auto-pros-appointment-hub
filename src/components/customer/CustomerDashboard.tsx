import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentBooking } from './AppointmentBooking';
import { AppointmentHistory } from './AppointmentHistory';
import { Calendar, Clock, Wrench, History } from 'lucide-react';

type TabType = 'overview' | 'book' | 'history';

export const CustomerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { user, profile } = useAuth();

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Wrench },
    { id: 'book' as TabType, label: 'Book Appointment', icon: Calendar },
    { id: 'history' as TabType, label: 'My Appointments', icon: History },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'book':
        return <AppointmentBooking onSuccess={() => setActiveTab('history')} />;
      case 'history':
        return <AppointmentHistory />;
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-workshop">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quick Book</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">Schedule your next service</p>
                  <Button 
                    onClick={() => setActiveTab('book')}
                    className="btn-workshop-primary w-full"
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-workshop">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Service Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-xs">
                    <p>Monday - Friday: 8AM - 6PM</p>
                    <p>Saturday: 9AM - 4PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-workshop">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-xs">
                    <p>Phone: (555) 123-4567</p>
                    <p>Email: service@autopro.com</p>
                    <p>Emergency: (555) 911-HELP</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="card-workshop">
              <CardHeader>
                <CardTitle>Welcome back, {profile?.full_name || user?.email}!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  We're here to keep your vehicle running smoothly. Book your next appointment or check your service history.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => setActiveTab('book')}
                    className="btn-workshop-primary"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Service
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('history')}
                    variant="outline"
                  >
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Button>
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