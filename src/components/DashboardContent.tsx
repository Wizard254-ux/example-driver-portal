
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Plus, 
  Truck, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2
} from 'lucide-react';
import { driverService, DriverProfile } from '../services/driver';
import { toast } from '@/hooks/use-toast';
import CreateDriverModal from './CreateDriverModal';
import EditDriverModal from './EditDriverModal';
import ViewDriverModal from './ViewDriverModal';

const DashboardContent = () => {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await driverService.getDrivers();
      setDrivers(response.results);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load drivers.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await driverService.deleteDriver(id);
        setDrivers(drivers.filter(driver => driver.id !== id));
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active driver profiles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.filter(d => d.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Experience</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers.length > 0 
                ? Math.round(drivers.reduce((acc, d) => acc + d.years_of_experience, 0) / drivers.length)
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Driver Profiles</CardTitle>
              <CardDescription>
                Manage your organization's driver profiles
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first driver profile.</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Driver
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
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
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">
                            {driver.user.first_name} {driver.user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {driver.user.masked_email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-sm">{driver.license_number}</div>
                          <div className="text-xs text-gray-500">
                            Expires: {new Date(driver.license_expiry).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{driver.vehicle_type}</Badge>
                      </td>
                      <td className="py-3 px-4">
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
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateDriverModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadDrivers();
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
            driver={selectedDriver}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedDriver(null);
              loadDrivers();
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
