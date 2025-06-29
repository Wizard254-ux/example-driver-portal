import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import DashboardContent from '../components/DashboardContent';
import Profile from '../components/Profile';
import Settings from '../components/Settings';
import Landing from '../components/Landing';
import { organizationService } from '../services/organization';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Landing');
  const [orgSummary, setOrgSummary] = useState<{[key:string]:any}>({});
  const [loading, setLoading] = useState(false);
  
  // Get orgId once when component mounts
  const orgId = useMemo(() => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData).organization_id : null;
  }, []); // Empty dependency array - only runs once

  // Fix the useEffect dependency array - this was causing infinite re-renders
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!orgId) {
        console.error('Organization ID not found in local storage');
        return;
      }
      
      if (loading) return; // Prevent multiple simultaneous requests
      
      setLoading(true);
      try {
        const summary = await organizationService.getOrganization(orgId);
        console.log('Org Summary:', summary);
        setOrgSummary(summary);
      } catch (error) {
        console.error('Error fetching organization summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [orgId]); // Only run when orgId changes, not on every render

  // Memoize the content renderer to prevent unnecessary re-renders of child components
  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'Landing':
        return <Landing />;
      case 'Drivers':
        return <DashboardContent />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardContent />;
    }
  }, [activeTab]);

  // Memoize the rendered content
  const content = useMemo(() => renderContent(), [renderContent]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset>
          <header className="flex flex-row justify-between h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-50 bg-gray-800">
            <div className="flex items-center gap-2 flex-row">
              <SidebarTrigger className="-ml-1 text-white" />
              <div className="flex-1">
                <h1 className="text-xl font-semibold capitalize text-white">{activeTab}</h1>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold capitalize text-white">
                {orgSummary.name || ''}
              </h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {content}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;