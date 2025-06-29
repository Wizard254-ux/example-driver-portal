import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Truck, Mail, Lock, Package, MapPin,
  Clock, TrendingUp, Shield, Users, Eye, EyeOff
} from 'lucide-react';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      toast({
        title: "Login successful",
        description: "Welcome back to your dashboard.",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row">
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
          <div className="flex items-center mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mr-4">
              <Truck className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">TruckSmart</h1>
              <p className="text-sm sm:text-base text-blue-200">AI-Powered Driver Assistant</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              Control Your <br />
              <span className="text-blue-300">Trucking Business</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-blue-100 leading-relaxed">
              AI-powered expense tracking and route optimization for truck drivers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { icon: <Package className="h-5 w-5" />, title: 'Smart Tracking', desc: 'Auto-log expenses' },
              { icon: <MapPin className="h-5 w-5" />, title: 'AI Routes', desc: 'Save fuel & time' },
              { icon: <TrendingUp className="h-5 w-5" />, title: 'Budget Forecast', desc: 'Predict costs' },
              { icon: <Shield className="h-5 w-5" />, title: 'Financial Control', desc: 'Maximize profits' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">{feature.icon}</div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-blue-200">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="text-lg font-bold">$2.5M+</div>
              <div className="text-xs text-blue-200">Saved</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">25%</div>
              <div className="text-xs text-blue-200">Cost Cut</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">5K+</div>
              <div className="text-xs text-blue-200">Drivers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-[40vh] lg:min-h-screen">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Sign in to your logistics dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 lg:px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-gray-700">Remember me</label>
                </div>
                <div>
                  <a href="#" className="text-blue-600 hover:text-blue-500">Forgot password?</a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Trusted by drivers nationwide</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center space-x-6 text-gray-400 text-xs">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>Support</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                <span>Secure</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>24/7</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
