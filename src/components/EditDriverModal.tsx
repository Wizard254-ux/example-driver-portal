
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Truck } from 'lucide-react';
import { driverService, UpdateDriverData, DriverProfile } from '../services/driver';
import { toast } from '@/hooks/use-toast';

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverProfile;
  onSuccess: () => void;
}

const EditDriverModal: React.FC<EditDriverModalProps> = ({ isOpen, onClose, driver, onSuccess }) => {
  const [formData, setFormData] = useState<UpdateDriverData>({
    years_of_experience: driver.years_of_experience,
    vehicle_type: driver.vehicle_type,
    license_expiry: driver.license_expiry,
    bio: driver.bio || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const vehicleTypes = [
    'Car', 'Van', 'Truck', '18-Wheeler', 'Motorcycle', 'Bus'
  ];

  const handleChange = (field: keyof UpdateDriverData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await driverService.updateDriver(driver.id, formData);
      toast({
        title: "Success",
        description: "Driver profile updated successfully.",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update driver profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Driver Profile</DialogTitle>
          <DialogDescription>
            Update {driver.user.first_name} {driver.user.last_name}'s information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="years_of_experience">Years of Experience</Label>
            <Input
              id="years_of_experience"
              type="number"
              min="0"
              value={formData.years_of_experience}
              onChange={(e) => handleChange('years_of_experience', parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select 
              value={formData.vehicle_type} 
              onValueChange={(value) => handleChange('vehicle_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_expiry">License Expiry</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="license_expiry"
                type="date"
                value={formData.license_expiry}
                onChange={(e) => handleChange('license_expiry', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Brief description about the driver..."
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDriverModal;
