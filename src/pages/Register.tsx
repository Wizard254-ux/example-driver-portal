import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Mail, Lock, User, Phone, Building, Globe, Package, MapPin, TrendingUp, Shield, Users, Clock, CheckCircle, Key, Eye, EyeOff } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../components/phone-input.css';
import { authService } from '../services/auth';
import { toast } from '@/hooks/use-toast';

const Register = () => {
  const [step, setStep] = useState(1); // 1 for registration, 2 for activation
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    organization_name: '',
    organization_email_domain: '',
    organization_website: '',
    user_type: 'org_admin'
  });
  const [activationData, setActivationData] = useState({
    uidb64: '',
    token: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch (name) {
      case 'first_name':
      case 'last_name':
        return /^[A-Za-z]{2,}$/.test(value) ? '' : 'Must contain only letters, minimum 2 characters';
      case 'email':
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) ? '' : 'Enter a valid email address';
      case 'phone_number':
        if (!value) return 'Phone number is required';
        if (!isValidPhoneNumber(value)) return 'Please enter a valid phone number';
        return '';
      case 'organization_name':
        return value.length >= 2 ? '' : 'Organization name must be at least 2 characters';
      case 'organization_email_domain':
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/.test(value) ? '' : 'Enter a valid email address (e.g., admin@company.com)';
      case 'organization_website':
        return /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(value) ? '' : 'Enter a valid URL (e.g., https://company.com)';
      case 'password':
        const passwordErrors = [];
        if (value.length < 8) passwordErrors.push('at least 8 characters');
        if (!/[A-Z]/.test(value)) passwordErrors.push('one uppercase letter');
        if (!/[a-z]/.test(value)) passwordErrors.push('one lowercase letter');
        if (!/\d/.test(value)) passwordErrors.push('one digit');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) passwordErrors.push('one special character');
        return passwordErrors.length === 0 ? '' : `Password must contain ${passwordErrors.join(', ')}`;
      case 'password_confirm':
        return value === formData.password ? '' : 'Passwords do not match';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation
    const error = validateField(name, value);
    setFieldErrors({
      ...fieldErrors,
      [name]: error
    });
  };

  const handlePhoneChange = (value) => {
    setFormData({
      ...formData,
      phone_number: value || ''
    });
    
    // Real-time validation for phone
    const error = validateField('phone_number', value || '');
    setFieldErrors({
      ...fieldErrors,
      phone_number: error
    });
  };

  const handleActivationChange = (e) => {
    setActivationData({
      ...activationData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const errors = {};
    Object.keys(formData).forEach(field => {
      if (field !== 'user_type') {
        const error = validateField(field, formData[field]);
        if (error) errors[field] = error;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password !== formData.password_confirm) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Remove the '+' prefix from phone number before sending to backend
      const dataToSend = {
        ...formData,
        phone_number: formData.phone_number.startsWith('+') 
          ? formData.phone_number.slice(1) 
          : formData.phone_number
      };
      
      const res=await authService.register(dataToSend);
      localStorage.setItem('access_token',res.tokens.access)
      setUserEmail(formData.email);
      // setStep(2); // Move to activation step
      toast({
        title: "Registration successful",
        description: "You can now login.",
      });
      navigate('/login')
    } catch (error) {
      console.log(error);
      
      // Extract error message from different possible locations
      let errorMessage = "Please check your information and try again.";
      let errorTitle = "Registration failed";
      
      if (error.response) {
        // Server responded with error status
        const responseData = error.response.data;
        
        if (responseData && typeof responseData === 'object') {
          // Handle field validation errors dynamically and update form field errors
          const newFieldErrors = {};
          const errorMessages = [];
          
          Object.entries(responseData).forEach(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [messages];
            const fieldMessage = messageArray.join(', ');
            
            // Map backend field names to frontend field names if needed
            const frontendFieldName = field === 'non_field_errors' ? 'general' : field;
            
            if (frontendFieldName !== 'general') {
              newFieldErrors[frontendFieldName] = fieldMessage;
            }
            errorMessages.push(`${field === 'non_field_errors' ? 'Error' : field}: ${fieldMessage}`);
          });
          
          // Update field errors for visual feedback
          setFieldErrors(prevErrors => ({ ...prevErrors, ...newFieldErrors }));
          
          // Set error message for toast
          errorMessage = errorMessages.join('\n');
          
          // Specific handling for common errors
          if (responseData.email && responseData.email.some(msg => msg.includes('already exists'))) {
            errorTitle = "Email Already Registered";
            errorMessage = "An account with this email already exists. Please try logging in instead.";
          }
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection and try again.";
        errorTitle = "Connection Error";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivationSubmit = async (e) => {
    e.preventDefault();
    
    if (!activationData.uidb64 || !activationData.token) {
      toast({
        title: "Missing information",
        description: "Please enter both UID and activation token.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.activateAccount(activationData.uidb64, activationData.token);
      toast({
        title: "Account activated successfully",
        description: "You can now sign in to your account.",
      });
      navigate('/login');
    } catch (error) {
      console.log(error);
      
      let errorMessage = "Invalid activation code. Please check your email and try again.";
      let errorTitle = "Activation failed";
      
      if (error.response) {
        const responseData = error.response.data;
        if (responseData && typeof responseData === 'object') {
          const errorDetails = Object.entries(responseData)
            .map(([field, messages]) => {
              const messageArray = Array.isArray(messages) ? messages : [messages];
              return messageArray.join(', ');
            })
            .join('\n');
          errorMessage = errorDetails;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection and try again.";
        errorTitle = "Connection Error";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendActivationEmail = async () => {
    setIsLoading(true);
    try {
      // Assuming you have a resend activation endpoint
      await authService.resendActivation({ email: userEmail });
      toast({
        title: "Email sent",
        description: "A new activation email has been sent to your inbox.",
      });
    } catch (error) {
      toast({
        title: "Failed to resend",
        description: "Could not resend activation email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Design & Context */}
      <div className="flex-1 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden flex items-center justify-center min-h-[60vh] lg:min-h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border border-white rounded-full"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 border border-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 border-2 border-white rounded-full"></div>
        </div>

        <div className="relative z-10 max-w-lg text-white p-8">
          {/* Logo & Brand */}
          <div className="flex items-center mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mr-4">
              <Truck className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">TruckSmart</h1>
              <p className="text-blue-200">AI-Powered Driver Assistant</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-white text-blue-900' : 'bg-white/20 text-white'} font-semibold text-sm`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <div className={`h-0.5 w-8 ${step > 1 ? 'bg-white' : 'bg-white/20'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-white text-blue-900' : 'bg-white/20 text-white'} font-semibold text-sm`}>
                2
              </div>
            </div>
            <div className="flex text-sm space-x-12">
              <span className={step >= 1 ? 'text-white' : 'text-blue-300'}>Register</span>
              <span className={step >= 2 ? 'text-white' : 'text-blue-300'}>Activate</span>
            </div>
          </div>

          {/* Main Message */}
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              {step === 1 ? (
                <>
                  Join The 
                  <br />
                  <span className="text-blue-300">Smart Revolution</span>
                </>
              ) : (
                <>
                  Almost
                  <br />
                  <span className="text-blue-300">There!</span>
                </>
              )}
            </h2>
            <p className="text-base lg:text-lg text-blue-100 leading-relaxed">
              {step === 1 
                ? "Create your organization account and start optimizing your logistics operations today."
                : "Check your email and enter the activation details to complete your registration."
              }
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-start space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Smart Tracking</h3>
                <p className="text-sm text-blue-200">Auto-log expenses</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI Routes</h3>
                <p className="text-sm text-blue-200">Save fuel & time</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Budget Forecast</h3>
                <p className="text-sm text-blue-200">Predict costs</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Financial Control</h3>
                <p className="text-sm text-blue-200">Maximize profits</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="text-xl font-bold">$2.5M+</div>
              <div className="text-xs text-blue-200">Saved</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">25%</div>
              <div className="text-xs text-blue-200">Cost Cut</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">5K+</div>
              <div className="text-xs text-blue-200">Drivers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration/Activation Form */}
      <div className="flex-1 flex items-start justify-center p-4 bg-gray-50 min-h-[40vh] lg:h-screen overflow-y-auto">
        <Card className="w-full max-w-lg shadow-xl border-0 my-8">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Create Account' : 'Activate Account'}
            </CardTitle>
            <CardDescription className="text-base lg:text-lg text-gray-600">
              {step === 1 
                ? 'Set up your organization account'
                : `Activation email sent to ${userEmail}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 lg:px-8 pb-8">
            {step === 1 ? (
              /* Registration Form */
              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="first_name"
                        name="first_name"
                        placeholder="John"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`pl-12 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                          fieldErrors.first_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {fieldErrors.first_name && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.first_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="last_name"
                        name="last_name"
                        placeholder="Doe"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={`pl-12 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                          fieldErrors.last_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {fieldErrors.last_name && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.last_name}</p>
                    )}
                  </div>
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-12 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="US"
                      value={formData.phone_number}
                      onChange={handlePhoneChange}
                      className={`react-phone-number-input ${fieldErrors.phone_number ? 'border-red-500' : ''}`}
                      numberInputProps={{
                        className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-11 ${fieldErrors.phone_number ? 'border-red-500' : 'border-gray-300'}`
                      }}
                    />
                  </div>
                  {fieldErrors.phone_number && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.phone_number}</p>
                  )}
                </div>

                {/* Organization Name */}
                <div className="space-y-2">
                  <Label htmlFor="organization_name" className="text-sm font-medium text-gray-700">
                    Organization Name
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="organization_name"
                      name="organization_name"
                      placeholder="Example Logistics"
                      value={formData.organization_name}
                      onChange={handleChange}
                      className={`pl-12 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        fieldErrors.organization_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.organization_name && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.organization_name}</p>
                  )}
                </div>

                {/* Organization Email Domain */}
                <div className="space-y-2">
                  <Label htmlFor="organization_email_domain" className="text-sm font-medium text-gray-700">
                    Organization Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="organization_email_domain"
                      name="organization_email_domain"
                      placeholder="soltech@lomtechnology.com"
                      value={formData.organization_email_domain}
                      onChange={handleChange}
                      className={`pl-12 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        fieldErrors.organization_email_domain ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.organization_email_domain && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.organization_email_domain}</p>
                  )}
                </div>

                {/* Organization Website */}
                <div className="space-y-2">
                  <Label htmlFor="organization_website" className="text-sm font-medium text-gray-700">
                    Organization Website
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="organization_website"
                      name="organization_website"
                      placeholder="https://examplelogistics.com"
                      value={formData.organization_website}
                      onChange={handleChange}
                      className={`pl-12 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        fieldErrors.organization_website ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {fieldErrors.organization_website && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.organization_website}</p>
                  )}
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Strong password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-12 pr-12 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirm" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password_confirm"
                        name="password_confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        className="pl-12 pr-12 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password_confirm && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.password_confirm}</p>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            ) : (
              /* Activation Form */
              <div className="space-y-6">
                {/* Email Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 mb-1">Check Your Email</h3>
                      <p className="text-sm text-blue-700 mb-2">
                        We've sent activation instructions to <strong>{userEmail}</strong>
                      </p>
                      <p className="text-xs text-blue-600">
                        Look for the UID and Token in the activation email and enter them below.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleActivationSubmit} className="space-y-4">
                  {/* UID Field */}
                  <div className="space-y-2">
                    <Label htmlFor="uidb64" className="text-sm font-medium text-gray-700">
                      User ID (UID)
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="uidb64"
                        name="uidb64"
                        placeholder="Enter UID from email"
                        value={activationData.uidb64}
                        onChange={handleActivationChange}
                        className="pl-12 h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Token Field */}
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-sm font-medium text-gray-700">
                      Activation Token
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="token"
                        name="token"
                        placeholder="Enter activation token from email"
                        value={activationData.token}
                        onChange={handleActivationChange}
                        className="pl-12 h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Activating..." : "Activate Account"}
                  </Button>
                </form>

                {/* Resend Email */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Didn't receive the email?
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={resendActivationEmail}
                    disabled={isLoading}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    Resend Activation Email
                  </Button>
                </div>

                {/* Back to Registration */}
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-500 underline hover:text-gray-700"
                  >
                    ← Back to Registration
                  </button>
                </div>
              </div>
            )}
            
            {step === 1 && (
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  {step === 1 ? "Join thousands of drivers" : "Almost ready to join"}
                </span>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-4 flex items-center justify-center space-x-6 text-gray-400">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-xs">Support</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                <span className="text-xs">Secure</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-xs">24/7</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;