import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, User, Phone, CreditCard, Calendar, Truck, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './phone-input.css';
import { driverService, CreateDriverData } from '../services/driver';
import { subscriptionService } from '../services/subscription';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import UpgradeSubscriptionModal from './UpgradeSubscriptionModal'
import { SubscriptionStatus } from '../services/subscription';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgId: number;
  onTabChange:(tab:string)=>void;
  activeTab:string;
}



const CreateDriverModal: React.FC<CreateDriverModalProps> = ({ isOpen, onClose, onSuccess, orgId ,onTabChange,activeTab}) => {
  const [formData, setFormData] = useState<CreateDriverData>({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    license_number: '',
    license_expiry: '',
    years_of_experience: 0,
    vehicle_type: '',
    truck_license_plate: '',
    truck_model: '',
    date_of_birth: '',
    gender: '',
    bio: '',
    password: '',
    password_confirm: '',
    organization_id: orgId
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    canAddDriver: boolean;
    currentDrivers: number;
    maxDrivers: number;
    remainingSlots: number;
    error?: string;
  }>({ canAddDriver: true, currentDrivers: 0, maxDrivers: 0, remainingSlots: 0 });
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [fullSubscriptionStatus, setFullSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  // Check subscription status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkSubscriptionStatus();
    }
  }, [isOpen]);

  const checkSubscriptionStatus = async () => {
    setCheckingSubscription(true);
    try {
      // Get driver limit info
      const result = await subscriptionService.checkDriverLimit();
      setSubscriptionStatus({
        canAddDriver: result.can_add_driver,
        currentDrivers: result.current_drivers,
        maxDrivers: result.max_drivers,
        remainingSlots: result.remaining_slots
      });
      
      // Get full subscription details for upgrade modal
      try {
        const fullStatus = await subscriptionService.getSubscriptionStatus();
        setFullSubscriptionStatus(fullStatus);
      } catch (err) {
        console.error('Error fetching full subscription status:', err);
      }
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
      setCheckingSubscription(false);
    }
  };

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

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'first_name':
        if (!value || value.trim().length < 2) return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
        break;
      case 'last_name':
        if (!value || value.trim().length < 2) return 'Last name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        break;
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        break;
      case 'phone_number':
        if (!value) return 'Phone number is required';
        if (!isValidPhoneNumber(value)) return 'Please enter a valid phone number';
        break;
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
      if (key !== 'bio' && key !== 'organization_id' && key !== 'password' && key !== 'password_confirm') {
        const error = validateField(key, formData[key as keyof CreateDriverData]);
        if (error) errors[key] = error;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: keyof CreateDriverData, value: string | number) => {
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

    // Validate password in real-time
    if (field === 'password') {
      const errors = validatePassword(value as string);
      setPasswordErrors(errors);
    }

    // Validate other fields on blur (we'll add onBlur handlers)
    if (field !== 'password' && field !== 'password_confirm' && field !== 'bio' && field !== 'organization_id') {
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

    // Check subscription status before proceeding
    if (!subscriptionStatus.canAddDriver) {
      toast({
        title: "Subscription Limit Reached",
        description: subscriptionStatus.error || `Your subscription allows a maximum of ${subscriptionStatus.maxDrivers} drivers. Please upgrade your subscription to add more drivers.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Double-check subscription limit with fresh backend validation
    try {
      const validationResult = await subscriptionService.validateDriverAddition();
      if (!validationResult.can_add_driver) {
        setIsLoading(false);
        toast({
          title: "Subscription Error",
          description: `Driver limit reached. Your subscription allows ${validationResult.max_drivers} drivers. Currently have ${validationResult.current_drivers} drivers.`,
          variant: "destructive",
        });
        // Refresh subscription status
        await checkSubscriptionStatus();
        return;
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Subscription Error",
        description: error.response?.data?.error || "Unable to add more drivers with your current subscription.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Remove the '+' prefix from phone number before sending to backend
      const dataToSend = {
        ...formData,
        phone_number: formData.phone_number.startsWith('+') 
          ? formData.phone_number.slice(1) 
          : formData.phone_number
      };
      
      // Send all data including password and organization_id
      await driverService.createDriver(dataToSend);
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
        truck_license_plate: '',
        truck_model: '',
        date_of_birth: '',
        gender: '',
        bio: '',
        password: '',
        password_confirm: '',
        organization_id: orgId
      });
      setPasswordErrors([]);
      setFormErrors({});
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle Axios error format specifically
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Handle field-specific errors (like email already exists)
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
            description: "Failed to create driver profile. Please check your input.",
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Driver Profile</DialogTitle>
          <DialogDescription>
            Add a new driver to your organization
          </DialogDescription>
        </DialogHeader>

        {checkingSubscription ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3">Checking subscription status...</span>
          </div>
        ) : !subscriptionStatus.canAddDriver ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Subscription Limit Reached</AlertTitle>
            <AlertDescription>
              {subscriptionStatus.error || `Your subscription allows a maximum of ${subscriptionStatus.maxDrivers} drivers. You currently have ${subscriptionStatus.currentDrivers} drivers. Please upgrade your subscription to add more drivers.`}
            </AlertDescription>
            <div className="mt-4 flex flex-wrap gap-2">

              <Button 
                onClick={() => {
                  onClose();
                  onTabChange('subscription');
                }}
                variant="outline"
                className="mt-2"
              >
                View All Plans
              </Button>
              <Button 
                onClick={checkSubscriptionStatus}
                variant="outline"
                className="mt-2"
                disabled={checkingSubscription}
              >
                {checkingSubscription ? "Refreshing..." : "Refresh Status"}
              </Button>
            </div>
          </Alert>
        ) : subscriptionStatus.remainingSlots <= 2 ? (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Subscription Limit Warning</AlertTitle>
            <AlertDescription>
              You have {subscriptionStatus.remainingSlots} driver {subscriptionStatus.remainingSlots === 1 ? 'slot' : 'slots'} remaining in your current subscription.
            </AlertDescription>
          </Alert>
        ) : null}
        
        <form onSubmit={handleSubmit} className="space-y-4" style={{ opacity: !subscriptionStatus.canAddDriver ? 0.5 : 1 }}>
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
                  onBlur={(e) => {
                    const error = validateField('first_name', e.target.value);
                    setFormErrors(prev => ({ ...prev, first_name: error }));
                  }}
                  className={`pl-10 ${formErrors.first_name ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {formErrors.first_name && (
                <div className="text-sm text-red-500 mt-1">{formErrors.first_name}</div>
              )}
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
                  onBlur={(e) => {
                    const error = validateField('last_name', e.target.value);
                    setFormErrors(prev => ({ ...prev, last_name: error }));
                  }}
                  className={`pl-10 ${formErrors.last_name ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {formErrors.last_name && (
                <div className="text-sm text-red-500 mt-1">{formErrors.last_name}</div>
              )}
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
                onBlur={(e) => {
                  const error = validateField('email', e.target.value);
                  setFormErrors(prev => ({ ...prev, email: error }));
                }}
                className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                required
              />
            </div>
            {formErrors.email && (
              <div className="text-sm text-red-500 mt-1">{formErrors.email}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <div className="relative">
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="US"
                value={formData.phone_number}
                onChange={(value) => {
                  handleChange('phone_number', value || '');
                  const error = validateField('phone_number', value || '');
                  setFormErrors(prev => ({ ...prev, phone_number: error }));
                }}
                className={`react-phone-number-input ${formErrors.phone_number ? 'border-red-500' : ''}`}
                numberInputProps={{
                  className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.phone_number ? 'border-red-500' : 'border-gray-300'}`
                }}
              />
            </div>
            {formErrors.phone_number && (
              <div className="text-sm text-red-500 mt-1">{formErrors.phone_number}</div>
            )}
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
                onBlur={(e) => {
                  const error = validateField('license_number', e.target.value);
                  setFormErrors(prev => ({ ...prev, license_number: error }));
                }}
                className={`pl-10 ${formErrors.license_number ? 'border-red-500' : ''}`}
                required
              />
            </div>
            {formErrors.license_number && (
              <div className="text-sm text-red-500 mt-1">{formErrors.license_number}</div>
            )}
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
            </div>
            {formErrors.years_of_experience && (
              <div className="text-sm text-red-500 mt-1">{formErrors.years_of_experience}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select 
                onValueChange={(value) => {
                  handleChange('vehicle_type', value);
                  const error = validateField('vehicle_type', value);
                  setFormErrors(prev => ({ ...prev, vehicle_type: error }));
                }} 
                required
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
            <div className="space-y-2">
              <Label htmlFor="truck_license_plate">Truck License Plate</Label>
              <div className="relative">
                <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="truck_license_plate"
                  placeholder="ABC-1234"
                  value={formData.truck_license_plate || ''}
                  onChange={(e) => handleChange('truck_license_plate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truck_model">Truck Model (Optional)</Label>
              <div className="relative">
                <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="truck_model"
                  placeholder="Peterbilt 379"
                  value={formData.truck_model || ''}
                  onChange={(e) => handleChange('truck_model', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select onValueChange={(value) => handleChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
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
            <Button 
              type="submit" 
              disabled={isLoading || !subscriptionStatus.canAddDriver}
              title={!subscriptionStatus.canAddDriver ? "Subscription limit reached" : ""}
            >
              {isLoading ? "Creating..." : "Create Driver"}
            </Button>
          </div>
        </form>
        
        {/* Upgrade Subscription Modal */}
        <UpgradeSubscriptionModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentSubscription={fullSubscriptionStatus}
          requiredDrivers={subscriptionStatus.currentDrivers + 1}
          onSuccess={() => {
            setShowUpgradeModal(false);
            checkSubscriptionStatus(); // Refresh subscription status after upgrade
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateDriverModal;