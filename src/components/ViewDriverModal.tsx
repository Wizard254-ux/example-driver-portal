
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar, 
  Truck, 
  Building,
  Globe,
  Clock
} from 'lucide-react';
import { DriverProfile } from '../services/driver';

interface ViewDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverProfile;
}

const ViewDriverModal: React.FC<ViewDriverModalProps> = ({ isOpen, onClose, driver }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Driver Profile Details</DialogTitle>
          <DialogDescription>
            Complete information for {driver.user.first_name} {driver.user.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-lg">{driver.user.first_name} {driver.user.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">User Type</p>
                  <Badge variant="secondary">{driver.user.user_type}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </p>
                  <p>{driver.user.masked_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone
                  </p>
                  <p>{driver.user.masked_phone_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Status</p>
                  <div className="flex space-x-2">
                    <Badge variant={driver.user.is_active ? "default" : "secondary"}>
                      {driver.user.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={driver.user.is_email_verified ? "default" : "destructive"}>
                      {driver.user.is_email_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Joined
                  </p>
                  <p>{new Date(driver.user.date_joined).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" />
                    License Number
                  </p>
                  <p className="font-mono">{driver.license_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    License Expiry
                  </p>
                  <p>{new Date(driver.license_expiry).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Vehicle Type</p>
                  <Badge variant="outline">{driver.vehicle_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Years of Experience</p>
                  <p className="text-lg font-semibold">{driver.years_of_experience} years</p>
                </div>
              </div>

              {driver.bio && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Bio</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{driver.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Organization Name</p>
                  <p className="text-lg">{driver.organization.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email Domain</p>
                  <p>{driver.organization.email_domain}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </p>
                  <a 
                    href={driver.organization.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {driver.organization.website}
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant={driver.organization.is_active ? "default" : "secondary"}>
                    {driver.organization.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDriverModal;
