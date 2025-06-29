import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  X
} from 'lucide-react';
import { driverService, DriverProfile } from '../services/driver';
import { toast } from '@/hooks/use-toast';
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

const DashboardContent = () => {
  const [drivers, setDrivers] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      const email = driver.user.masked_email.toLowerCase();
      const license = driver.license_number.toLowerCase();
      const vehicleType = driver.vehicle_type.toLowerCase();
      
      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             license.includes(searchLower) ||
             vehicleType.includes(searchLower);
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

  useEffect(() => {
    loadDrivers();
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
      console.log(response);
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

  const handleDeleteDriver = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await driverService.deleteDriver(id);
        const updatedDrivers = drivers.filter(driver => driver.id !== id);
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
      }
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
              {filteredDrivers?.filter(d => d.is_active)?.length || 0}
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
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search drivers by name, email, license number, or vehicle type..."
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
              {/* Mobile Cards View */}
              <div className="block lg:hidden">
                <div className="space-y-4 p-4">
                  {filteredDrivers?.map((driver) => (
                    <Card key={driver.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {driver.user.first_name} {driver.user.last_name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {driver.user.masked_email}
                            </div>
                          </div>
                          <Badge variant={driver.is_active ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                            {driver.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">License:</span>
                            <div className="truncate">{driver.license_number}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Experience:</span>
                            <div>{driver.years_of_experience} years</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary" className="text-xs">
                            {driver.vehicle_type}
                          </Badge>
                          <div className="flex space-x-1">
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
                              onClick={() => handleDeleteDriver(driver.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Driver</th>
                        <th className="text-left py-3 px-4 font-medium">License</th>
                        <th className="text-left py-3 px-4 font-medium">Vehicle Type</th>
                        <th className="text-left py-3 px-4 font-medium">Experience</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrivers?.map((driver) => (
                        <tr key={driver.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 min-w-0">
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {driver.user.first_name} {driver.user.last_name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {driver.user.masked_email}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 min-w-0">
                            <div className="min-w-0">
                              <div className="text-sm truncate">{driver.license_number}</div>
                              <div className="text-xs text-gray-500">
                                Expires: {new Date(driver.license_expiry).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="text-xs">
                              {driver.vehicle_type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {driver.years_of_experience} years
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={driver.is_active ? "default" : "secondary"}>
                              {driver.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
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
                                onClick={() => handleDeleteDriver(driver.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
    </div>
  );
};

export default DashboardContent;