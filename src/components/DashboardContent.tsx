import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Plus, 
  Truck, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2,
  RefreshCw,
  Search,
  X,
  MoreVertical,
  ChevronDown,
  CreditCard,
  AlertCircle,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { driverService, DriverProfile } from '../services/driver';
import { subscriptionService } from '../services/subscription';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CreateDriverModal from './CreateDriverModal';
import EditDriverModal from './EditDriverModal';
import ViewDriverModal from './ViewDriverModal';

// Cache key for drivers data
const DRIVERS_CACHE_KEY = 'dashboard_drivers_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData {
  data: any[];
  timestamp: number;
}

// Dropdown Menu Component
const ActionDropdown = ({ driver, onView, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        Actions
        <ChevronDown className="h-3 w-3" />
      </Button>
      
      {isOpen && (
        <>
          {/* Overlay to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={() => handleAction(() => onView(driver))}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
              <button
                onClick={() => handleAction(() => onEdit(driver))}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => handleAction(() => onDelete(driver.user.id, `${driver.user.first_name} ${driver.user.last_name}`))}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const DashboardContent = ({onTabChange,activeTab}) => {
  const [drivers, setDrivers] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<{id: number, name: string} | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    canAddDriver: boolean;
    currentDrivers: number;
    maxDrivers: number;
    remainingSlots: number;
    subscriptionName?: string;
    error?: string;
  }>({ canAddDriver: true, currentDrivers: 0, maxDrivers: 0, remainingSlots: 0 });
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const orgId = useMemo(() => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData).organization_id : null;
  }, []);

  // Filter drivers based on search term
  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim()) return drivers;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return drivers.filter(driver => {
      const fullName = `${driver.user.first_name} ${driver.user.last_name}`.toLowerCase();
      const email = driver.user.masked_email?.toLowerCase() || '';
      const license = driver.license_number?.toLowerCase() || '';
      const vehicleType = driver.vehicle_type?.toLowerCase() || '';
      const gender = driver.user.gender?.toLowerCase() || '';
      const truckPlate = driver.truck_license_plate?.toLowerCase() || '';
      const truckModel = driver.truck_model?.toLowerCase() || '';
      
      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             license.includes(searchLower) ||
             vehicleType.includes(searchLower) ||
             gender.includes(searchLower) ||
             truckPlate.includes(searchLower) ||
             truckModel.includes(searchLower);
    });
  }, [drivers, searchTerm]);

  // Check if cached data is valid
  const getCachedData = (): any[] | null => {
    try {
      const cached = localStorage.getItem(DRIVERS_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp }: CachedData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - timestamp < CACHE_DURATION) {
        return data;
      }
      
      // Cache expired, remove it
      localStorage.removeItem(DRIVERS_CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      localStorage.removeItem(DRIVERS_CACHE_KEY);
      return null;
    }
  };

  // Save data to cache
  const setCachedData = (data: any) => {
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(DRIVERS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    setLoadingSubscription(true);
    try {
      const result = await subscriptionService.checkDriverLimit();
      setSubscriptionStatus({
        canAddDriver: result.can_add_driver,
        currentDrivers: result.current_drivers,
        maxDrivers: result.max_drivers,
        remainingSlots: result.remaining_slots,
        subscriptionName: result.subscription_name
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionStatus({
        canAddDriver: false,
        currentDrivers: 0,
        maxDrivers: 0,
        remainingSlots: 0,
        error: error.response?.data?.error || 'No active subscription found. Please subscribe to add drivers.'
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  useEffect(() => {
    loadDrivers();
    fetchSubscriptionStatus();
  }, []);

  const loadDrivers = async (forceRefresh = false) => {
    try {
      // Try to load from cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          setDrivers(cachedData);
          setIsLoading(false);
          return;
        }
      }

      const response = await driverService.getDrivers();
      console.log('fetched drivers ',response);
      setDrivers(response);
      
      // Cache the fresh data
      setCachedData(response);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load drivers.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDrivers(true); // Force refresh
    toast({
      title: "Success",
      description: "Data refreshed successfully.",
    });
  };

  const handleDeleteDriver = (userId: number, driverName: string) => {
    setDriverToDelete({ id: userId, name: driverName });
    setShowDeleteDialog(true);
  };

  const confirmDeleteDriver = async () => {
    if (!driverToDelete) return;
    
    try {
      await driverService.deleteDriver(driverToDelete.id);
      const updatedDrivers = drivers.filter(driver => driver.user.id !== driverToDelete.id);
      setDrivers(updatedDrivers);
      
      // Update cache with new data
      setCachedData(updatedDrivers);
      
      toast({
        title: "Success",
        description: "Driver deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete driver.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setDriverToDelete(null);
    }
  };

  const handleEditDriver = (driver: DriverProfile) => {
    setSelectedDriver(driver);
    setShowEditModal(true);
  };

  const handleViewDriver = (driver: DriverProfile) => {
    setSelectedDriver(driver);
    setShowViewModal(true);
  };

  const handleModalSuccess = () => {
    // Clear cache when data is modified
    localStorage.removeItem(DRIVERS_CACHE_KEY);
    loadDrivers(true); // Force refresh after successful operations
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Driver Profiles Report', 20, 20);
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Summary stats
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('Summary', 20, 45);
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total Drivers: ${filteredDrivers.length}`, 20, 55);
    doc.text(`Active Drivers: ${filteredDrivers.filter(d => d.is_active).length}`, 20, 65);
    doc.text(`Average Experience: ${filteredDrivers.length > 0 ? Math.round(filteredDrivers.reduce((acc, d) => acc + d.years_of_experience, 0) / filteredDrivers.length) : 0} years`, 20, 75);
    
    if (searchTerm) {
      doc.text(`Filtered by: "${searchTerm}"`, 20, 85);
    }
    
    // Drivers table
    const tableData = filteredDrivers.map(driver => [
      `${driver.user.first_name || 'N/A'} ${driver.user.last_name || 'N/A'}`,
      driver.user.masked_email || 'N/A',
      driver.license_number || 'N/A',
      driver.license_expiry ? formatDate(driver.license_expiry) : 'N/A',
      driver.user.gender || 'Not specified',
      driver.vehicle_type || 'N/A',
      driver.truck_license_plate || 'Not assigned',
      driver.truck_model || 'Not specified',
      driver.years_of_experience?.toString() || '0',
      driver.is_active ? 'Active' : 'Inactive'
    ]);
    
    autoTable(doc, {
      startY: searchTerm ? 95 : 85,
      head: [['Name', 'Email', 'License #', 'License Exp', 'Gender', 'Vehicle Type', 'Truck Plate', 'Truck Model', 'Experience', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 20 }, // Name
        1: { cellWidth: 25 }, // Email
        2: { cellWidth: 18 }, // License
        3: { cellWidth: 16 }, // License Exp
        4: { cellWidth: 12 }, // Gender
        5: { cellWidth: 15 }, // Vehicle Type
        6: { cellWidth: 16 }, // Truck Plate
        7: { cellWidth: 18 }, // Truck Model
        8: { cellWidth: 12 }, // Experience
        9: { cellWidth: 12 }  // Status
      }
    });
    
    // Save the PDF
    const filename = searchTerm 
      ? `drivers_filtered_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      : `all_drivers_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(filename);
    
    toast({
      title: "Success",
      description: `PDF exported successfully with ${filteredDrivers.length} drivers.`,
    });
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add metadata
    csvContent += "Driver Profiles Report\n";
    csvContent += `Generated on,${new Date().toLocaleDateString()}\n`;
    csvContent += `Total Drivers,${filteredDrivers.length}\n`;
    csvContent += `Active Drivers,${filteredDrivers.filter(d => d.is_active).length}\n`;
    
    if (searchTerm) {
      csvContent += `Filtered by,\"${searchTerm}\"\n`;
    }
    
    csvContent += "\n";
    
    // Headers
    csvContent += "Name,Email,Phone,Driver ID,License Number,License Expiry,Gender,Years of Experience,Vehicle Type,Truck License Plate,Truck Model,Organization,Account Status,Driver Status,Date Joined,Bio\n";
    
    // Data rows
    filteredDrivers.forEach(driver => {
      const row = [
        `"${(driver.user.first_name || 'N/A')} ${(driver.user.last_name || 'N/A')}"`,
        `"${driver.user.masked_email || 'N/A'}"`,
        `"${driver.user.masked_phone_number || 'N/A'}"`,
        `"${driver.user.id || 'N/A'}"`,
        `"${driver.license_number || 'N/A'}"`,
        `"${driver.license_expiry ? formatDate(driver.license_expiry) : 'N/A'}"`,
        `"${driver.user.gender || 'Not specified'}"`,
        `"${driver.years_of_experience || '0'}"`,
        `"${driver.vehicle_type || 'N/A'}"`,
        `"${driver.truck_license_plate || 'Not assigned'}"`,
        `"${driver.truck_model || 'Not specified'}"`,
        `"${driver.organization?.name || 'N/A'}"`,
        `"${driver.user.is_active ? 'Active' : 'Inactive'}"`,
        `"${driver.is_active ? 'Active' : 'Inactive'}"`,
        `"${driver.user.created_at ? formatDate(driver.user.created_at) : 'N/A'}"`,
        `"${driver.bio || 'Not Provided'}"`
      ];
      csvContent += row.join(',') + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const filename = searchTerm 
      ? `drivers_filtered_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      : `all_drivers_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: `CSV exported successfully with ${filteredDrivers.length} drivers.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Truck className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 px-4">
      {/* Header with Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-sm">Manage your organization's driver profiles</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards - Show filtered stats when searching */}
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">
              {searchTerm ? 'Filtered' : 'Total'} Drivers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDrivers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {searchTerm ? 'Matching search criteria' : 'Active driver profiles'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Active Drivers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredDrivers?.length>0&&filteredDrivers.filter(d => d.is_active)?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Avg Experience</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredDrivers?.length > 0 
                ? Math.round(filteredDrivers.reduce((acc, d) => acc + d.years_of_experience, 0) / filteredDrivers.length)
                : 0
              } yrs
            </div>
            <p className="text-xs text-muted-foreground">
              Years of experience
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate">Driver Profiles</CardTitle>
              <CardDescription className="text-sm">
                {searchTerm 
                  ? `Showing ${filteredDrivers.length} of ${drivers.length} drivers matching "${searchTerm}"`
                  : 'Manage your organization\'s driver profiles'
                }
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {filteredDrivers.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportToPDF} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToCSV} className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button 
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search drivers by name, email, license, gender, vehicle type, truck details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 focus:outline-none focus:ring-0"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              {filteredDrivers.length} of {drivers.length} drivers found
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {filteredDrivers?.length === 0 ? (
            <div className="text-center py-12 px-4">
              {searchTerm ? (
                <>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
                  <p className="text-gray-500 mb-4">
                    No drivers match your search criteria "{searchTerm}". Try adjusting your search terms.
                  </p>
                  <Button variant="outline" onClick={clearSearch}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers yet</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first driver profile.</p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Driver
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="w-full">
              {/* Unified Table View for all screen sizes */}
              <div className="overflow-x-auto ">
                <table className="w-full min-w-full overflow-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-sm">Driver</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-sm hidden sm:table-cell">License</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-sm hidden md:table-cell">Gender</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-sm hidden lg:table-cell">Vehicle</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-sm hidden lg:table-cell">Truck Details</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-sm hidden xl:table-cell">Experience</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-sm">Status</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className='ozverflow-y-auto'>
                    {Array.isArray(filteredDrivers) &&filteredDrivers?.length>0&&filteredDrivers.map((driver) => (
                      
                      <tr key={driver.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 sm:px-4 min-w-0">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {driver.user.first_name} {driver.user.last_name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {driver.user.masked_email}
                            </div>
                            {/* Show license info on mobile */}
                            <div className="text-xs text-gray-500 truncate sm:hidden">
                              {driver.license_number}
                            </div>
                            {/* Show additional info on mobile and small tablets */}
                            <div className="text-xs text-gray-500 truncate md:hidden">
                              {driver.vehicle_type} • {driver.years_of_experience}yr
                            </div>
                            {/* Show gender on mobile */}
                            <div className="text-xs text-gray-500 truncate md:hidden">
                              {driver.user.gender || 'Not specified'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 min-w-0 hidden sm:table-cell">
                          <div className="min-w-0">
                            <div className="text-sm truncate">{driver.license_number}</div>
                            <div className="text-xs text-gray-500">
                              Exp: {new Date(driver.license_expiry).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm hidden md:table-cell">
                          <span className="capitalize">
                            {driver.user.gender || 'Not specified'}
                          </span>
                        </td>
                        <td className="py-3 px-2 sm:px-4 min-w-0 hidden lg:table-cell">
                          <div className="min-w-0">
                            <div className="text-sm truncate font-medium">{driver.vehicle_type}</div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 min-w-0 hidden lg:table-cell">
                          <div className="min-w-0">
                            <div className="text-sm truncate">{driver.truck_license_plate || 'Not assigned'}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {driver.truck_model || 'Model not specified'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm hidden xl:table-cell">
                          {driver.years_of_experience} years
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          <Badge 
                            variant={driver.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {driver.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          {/* Desktop view - show all buttons */}
                          <div className="hidden lg:flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDriver(driver)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditDriver(driver)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDriver(driver.user.id, `${driver.user.first_name} ${driver.user.last_name}`)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Mobile/Tablet view - show dropdown */}
                          <div className="lg:hidden">
                            <ActionDropdown
                              driver={driver}
                              onView={handleViewDriver}
                              onEdit={handleEditDriver}
                              onDelete={handleDeleteDriver}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateDriverModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        orgId={orgId}
        onTabChange={onTabChange}
        activeTab={activeTab}
        onSuccess={() => {
          setShowCreateModal(false);
          handleModalSuccess();
        }}
      />

      {selectedDriver && (
        <>
          <EditDriverModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedDriver(null);
            }}
            orgId={orgId}
            driver={selectedDriver}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedDriver(null);
              handleModalSuccess();
            }}
          />

          <ViewDriverModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setSelectedDriver(null);
            }}
            driver={selectedDriver}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Driver
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{driverToDelete?.name}</strong>? This action cannot be undone and will permanently remove the driver profile and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteDriver}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Driver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardContent;