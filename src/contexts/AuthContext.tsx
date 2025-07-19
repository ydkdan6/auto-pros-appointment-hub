import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'technician';
  phone?: string;
  isApproved?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'technician';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data - in a real app this would be from a database
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Admin',
    email: 'admin@autopro.com',
    role: 'admin',
    phone: '+1234567890',
    isApproved: true
  },
  {
    id: '2',
    name: 'Mike Technician',
    email: 'mike@autopro.com',
    role: 'technician',
    phone: '+1234567891',
    isApproved: true
  },
  {
    id: '3',
    name: 'Sarah Customer',
    email: 'sarah@example.com',
    role: 'customer',
    phone: '+1234567892',
    isApproved: true
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('autopro_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === 'password123') {
      // Check if technician is approved
      if (foundUser.role === 'technician' && !foundUser.isApproved) {
        setIsLoading(false);
        return false;
      }
      
      setUser(foundUser);
      localStorage.setItem('autopro_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email === data.email);
    if (existingUser) {
      setIsLoading(false);
      return false;
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      isApproved: data.role === 'customer' ? true : false // Customers auto-approved, technicians need admin approval
    };
    
    mockUsers.push(newUser);
    
    if (data.role === 'customer') {
      setUser(newUser);
      localStorage.setItem('autopro_user', JSON.stringify(newUser));
    }
    
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('autopro_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};