import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Truck, CreditCard } from 'lucide-react';
import { driverService, UpdateDriverData, DriverProfile } from '../services/driver';
import { toast } from '@/hooks/use-toast';

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverProfile;
  onSuccess: () => void;
  orgId: number; // Ensure orgId is passed correctly
}

const EditDriverModal: React.FC<EditDriverModalProps> = ({ isOpen, onClose, driver, onSuccess, orgId }) => {
  const [formData, setFormData] = useState<UpdateDriverData>({
    years_of_experience: driver.years_of_experience,
    vehicle_type: driver.vehicle_type,
    license_number: driver.license_number,
    license_expiry: driver.license_expiry,
    truck_model: driver.truck_model || '',
    truck_license_plate: driver.truck_license_plate || '',
    bio: driver.bio || '',
    organization_id: orgId,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const vehicleTypes = [
    'Car', 'Van', 'Truck', '18-Wheeler', 'Motorcycle', 'Bus'
  ];



  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'license_number':
        if (!value || value.trim().length < 5) return 'License number must be at least 5 characters';
        if (!/^[a-zA-Z0-9]+$/.test(value)) return 'License number can only contain letters and numbers';
        break;
      case 'license_expiry':
        if (!value) return 'License expiry date is required';
        const expiryDate = new Date(value);
        const today = new Date();
        if (expiryDate <= today) return 'License expiry date must be in the future';
        break;
      case 'years_of_experience':
        if (value < 0) return 'Years of experience cannot be negative';
        if (value > 50) return 'Years of experience seems too high';
        break;
      case 'vehicle_type':
        if (!value) return 'Vehicle type is required';
        break;
    }
    return '';
  };

  const validateAllFields = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    Object.keys(formData).forEach(key => {
      if (key !== 'bio' && key !== 'organization_id' && key !== 'truck_model' && key !== 'truck_license_plate') {
        const error = validateField(key, formData[key as keyof UpdateDriverData]);
        if (error) errors[key] = error;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: keyof UpdateDriverData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Validate field on change (except optional fields)
    if (field !== 'bio' && field !== 'organization_id' && field !== 'truck_model' && field !== 'truck_license_plate') {
      const error = validateField(field, value);
      if (error) {
        setFormErrors(prev => ({
          ...prev,
          [field]: error
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields first
    if (!validateAllFields()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    formData.organization_id = orgId; // Ensure orgId is included in the update
    console.log(formData)

    try {
      console.log('Submitting form data:', driver);
      await driverService.updateDriver(driver.user.id, formData);
      toast({
        title: "Success",
        description: "Driver profile updated successfully.",
      });
      onSuccess();
    } catch (error: any) {
      console.error('Update error:', error);
      
      // Handle Axios error format specifically
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Handle field-specific errors
        if (typeof errorData === 'object' && !errorData.error && !errorData.errors) {
          const fieldErrors: {[key: string]: string} = {};
          const errorMessages: string[] = [];
          
          Object.keys(errorData).forEach(field => {
            const fieldErrorArray = errorData[field];
            if (Array.isArray(fieldErrorArray)) {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ');
              const errorMessage = fieldErrorArray[0]; // Take first error
              fieldErrors[field] = errorMessage;
              errorMessages.push(`${fieldName}: ${errorMessage}`);
            }
          });
          
          // Set field-specific errors
          setFormErrors(fieldErrors);
          
          toast({
            title: "Validation Error",
            description: errorMessages.join('\n'),
            variant: "destructive",
          });
        }
        // Check if we have structured validation errors
        else if (errorData.errors) {
          const fieldErrors: {[key: string]: string} = {};
          const errorMessages: string[] = [];
          
          Object.keys(errorData.errors).forEach(field => {
            const fieldErrorArray = errorData.errors[field];
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ');
            const errorMessage = Array.isArray(fieldErrorArray) ? fieldErrorArray[0] : fieldErrorArray;
            fieldErrors[field] = errorMessage;
            errorMessages.push(`${fieldName}: ${errorMessage}`);
          });
          
          setFormErrors(fieldErrors);
          
          toast({
            title: "Validation Error",
            description: errorMessages.join('\n'),
            variant: "destructive",
          });
        } 
        // Check if we have a general error message
        else if (errorData.error) {
          toast({
            title: "Error",
            description: errorData.error,
            variant: "destructive",
          });
        }
        // Fallback to any other error format
        else if (typeof errorData === 'string') {
          toast({
            title: "Error",
            description: errorData,
            variant: "destructive",
          });
        }
        // Last resort - show generic message
        else {
          toast({
            title: "Error",
            description: "Failed to update driver profile. Please check your input.",
            variant: "destructive",
          });
        }
      } 
      // Network or other errors
      else if (error.code === 'ERR_BAD_REQUEST' || error.name === 'AxiosError') {
        toast({
          title: "Request Error",
          description: error.message || "Bad request. Please check your input and try again.",
          variant: "destructive",
        });
      }
      else {
        toast({
          title: "Network Error",
          description: "Unable to connect to server. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Driver Profile</DialogTitle>
          <DialogDescription>
            Update {driver.user.first_name} {driver.user.last_name}'s information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license_number">License Number</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="license_number"
                type="text"
                value={formData.license_number}
                onChange={(e) => handleChange('license_number', e.target.value)}
                onBlur={(e) => {
                  const error = validateField('license_number', e.target.value);
                  setFormErrors(prev => ({ ...prev, license_number: error }));
                }}
                className={`pl-10 ${formErrors.license_number ? 'border-red-500' : ''}`}
                placeholder="DL1234567"
                required
              />
            </div>
            {formErrors.license_number && (
              <div className="text-sm text-red-500 mt-1">{formErrors.license_number}</div>
            )}
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
                onBlur={(e) => {
                  const error = validateField('license_expiry', e.target.value);
                  setFormErrors(prev => ({ ...prev, license_expiry: error }));
                }}
                className={`pl-10 ${formErrors.license_expiry ? 'border-red-500' : ''}`}
                required
              />
            </div>
            {formErrors.license_expiry && (
              <div className="text-sm text-red-500 mt-1">{formErrors.license_expiry}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="years_of_experience">Years of Experience</Label>
            <Input
              id="years_of_experience"
              type="number"
              min="0"
              placeholder="5"
              value={formData.years_of_experience}
              onChange={(e) => handleChange('years_of_experience', parseInt(e.target.value) || 0)}
              onBlur={(e) => {
                const error = validateField('years_of_experience', parseInt(e.target.value) || 0);
                setFormErrors(prev => ({ ...prev, years_of_experience: error }));
              }}
              className={formErrors.years_of_experience ? 'border-red-500' : ''}
              required
            />
            {formErrors.years_of_experience && (
              <div className="text-sm text-red-500 mt-1">{formErrors.years_of_experience}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select 
              value={formData.vehicle_type} 
              onValueChange={(value) => {
                handleChange('vehicle_type', value);
                const error = validateField('vehicle_type', value);
                setFormErrors(prev => ({ ...prev, vehicle_type: error }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.vehicle_type && (
              <div className="text-sm text-red-500 mt-1">{formErrors.vehicle_type}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truck_model">Truck Model</Label>
              <div className="relative">
                <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="truck_model"
                  type="text"
                  value={formData.truck_model || ''}
                  onChange={(e) => handleChange('truck_model', e.target.value)}
                  className="pl-10"
                  placeholder="Peterbilt 379"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="truck_license_plate">Truck License Plate</Label>
              <div className="relative">
                <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="truck_license_plate"
                  type="text"
                  value={formData.truck_license_plate || ''}
                  onChange={(e) => handleChange('truck_license_plate', e.target.value)}
                  className="pl-10"
                  placeholder="ABC-1234"
                />
              </div>
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