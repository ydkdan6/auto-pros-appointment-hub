import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { CustomerDashboard } from '@/components/customer/CustomerDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { TechnicianDashboard } from '@/components/technician/TechnicianDashboard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, profile, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (!user || !profile) return null;

    // Check if technician is approved
    if (profile.role === 'technician' && !profile.is_approved) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 max-w-md">
              <h2 className="text-xl font-semibold mb-2">Account Pending Approval</h2>
              <p className="text-muted-foreground">
                Your technician account is currently pending admin approval. 
                You'll be able to access your dashboard once approved.
              </p>
            </div>
          </div>
        </div>
      );
    }

    switch (profile.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'technician':
        return <TechnicianDashboard />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[80vh]">
            {showRegister ? (
              <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
            ) : (
              <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Index;
