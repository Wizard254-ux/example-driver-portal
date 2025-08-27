import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import DashboardContent from '../components/DashboardContent';
import Profile from '../components/Profile';
import Settings from '../components/Settings';
import Landing from '../components/Landing';
import Subscription from '../components/Subscription';
import { organizationService } from '../services/organization';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Landing');
  const [orgSummary, setOrgSummary] = useState<{[key:string]:any}>({});
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  /**
   * Extract organization ID from stored user data
   * Memoized to prevent unnecessary re-parsing on every render
   */
  const orgId = useMemo(() => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData).organization_id : null;
  }, []); // Empty dependency array - only runs once

  /**
   * Handle deep linking via URL parameters
   * Supports direct navigation to subscription tab with preselected plan
   * Example: /dashboard?tab=subscription&plan=2
   */
  useEffect(() => {
    const tab = searchParams.get('tab');
    const plan = searchParams.get('plan');
    
    if (tab === 'subscription') {
      setActiveTab('subscription');
      if (plan) {
        setSelectedPlanId(plan); // Preselect specific plan for upgrade
      }
      // Clear URL parameters after processing to clean up URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  /**
   * Fetch organization data for dashboard header
   * Only runs when orgId changes to prevent unnecessary API calls
   * Includes loading state management to prevent concurrent requests
   */
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

  /**
   * Memoized content renderer to prevent unnecessary re-renders
   * Each tab renders a different component with appropriate props
   * 
   * Tab Mapping:
   * - Landing: Dashboard overview and quick actions
   * - Drivers: Driver management interface (maps to DashboardContent)
   * - subscription: Subscription and billing management
   * - profile: User profile settings
   * - settings: Application settings
   */
  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'Landing':
        return <Landing />;
      case 'Drivers':
        return <DashboardContent activeTab={activeTab} onTabChange={setActiveTab}/>;
      case 'subscription':
        return <Subscription selectedPlanId={selectedPlanId} onPlanProcessed={() => setSelectedPlanId(null)} />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardContent activeTab={activeTab} onTabChange={setActiveTab}/>;
    }
  }, [activeTab, selectedPlanId]); // Include selectedPlanId in dependencies

  // Memoize the rendered content to prevent unnecessary re-renders
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