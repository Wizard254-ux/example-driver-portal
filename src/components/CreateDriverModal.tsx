import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, User, Phone, CreditCard, Calendar, Truck, Lock, Eye, EyeOff } from 'lucide-react';
import { driverService, CreateDriverData } from '../services/driver';
import { toast } from '@/hooks/use-toast';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgId: number;
}



const CreateDriverModal: React.FC<CreateDriverModalProps> = ({ isOpen, onClose, onSuccess, orgId }) => {
  const [formData, setFormData] = useState<CreateDriverData>({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    license_number: '',
    license_expiry: '',
    years_of_experience: 0,
    vehicle_type: '',
    bio: '',
    password: '',
    password_confirm: '',
    organization_id: orgId
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const vehicleTypes = [
    'Car', 'Van', 'Truck', '18-Wheeler', 'Motorcycle', 'Bus'
  ];

  const validatePassword = (password: string): string[] => {
    const errors = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  const handleChange = (field: keyof CreateDriverData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate password in real-time
    if (field === 'password') {
      const errors = validatePassword(value as string);
      setPasswordErrors(errors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    const passwordValidationErrors = validatePassword(formData.password);
    if (passwordValidationErrors.length > 0) {
      toast({
        title: "Password Validation Error",
        description: passwordValidationErrors.join('\n'),
        variant: "destructive",
      });
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.password_confirm) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Send all data including password and organization_id
      await driverService.createDriver(formData);
      toast({
        title: "Success",
        description: "Driver profile created successfully.",
      });
      onSuccess();
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        license_number: '',
        license_expiry: '',
        years_of_experience: 0,
        vehicle_type: '',
        bio: '',
        password: '',
        password_confirm: '',
        organization_id: orgId
      });
      setPasswordErrors([]);
    } catch (error) {
      console.error('Registration error:', error);
      
      // Try to extract error details from the response
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Check if we have structured validation errors
        if (errorData.errors) {
          // Format field-specific errors
          const errorMessages = [];
          Object.keys(errorData.errors).forEach(field => {
            const fieldErrors = errorData.errors[field];
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ');
            errorMessages.push(`${fieldName}: ${fieldErrors.join(', ')}`);
          });
          
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
            description: "Failed to create driver profile. Please check your input.",
            variant: "destructive",
          });
        }
      } 
      // Network or other errors
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Driver Profile</DialogTitle>
          <DialogDescription>
            Add a new driver to your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="driver@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone_number"
                placeholder="1234567890"
                value={formData.phone_number}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {passwordErrors.length > 0 && (
                <div className="text-sm text-red-500">
                  {passwordErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirm">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password_confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password_confirm}
                  onChange={(e) => handleChange('password_confirm', e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {formData.password_confirm && formData.password !== formData.password_confirm && (
                <div className="text-sm text-red-500">
                  Passwords do not match
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_number">License Number</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="license_number"
                placeholder="DL1234567"
                value={formData.license_number}
                onChange={(e) => handleChange('license_number', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="years_of_experience">Years of Experience</Label>
              <Input
                id="years_of_experience"
                type="number"
                min="0"
                placeholder="5"
                value={formData.years_of_experience}
                onChange={(e) => handleChange('years_of_experience', parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select onValueChange={(value) => handleChange('vehicle_type', value)} required>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
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
              {isLoading ? "Creating..." : "Create Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDriverModal;