import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { 
  Home, 
  Users, 
  UserCircle, 
  Settings, 
  LogOut, 
  Truck,
  Menu,
  ChevronLeft
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { authService } from "../services/auth"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface AppSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  {
    id: "Landing",
    title: "Dashboard",
    icon: Home,
  },
  {
    id: "dashboard",
    title: "Drivers",
    icon: Users,
  },
  {
    id: "profile",
    title: "Profile",
    icon: UserCircle,
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
  },
]

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    authService.logout()
    setUser(null)
    navigate('/login')
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <Sidebar className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-gray-800 border-r border-gray-600`}>
      <SidebarHeader className="bg-gray-800 border-b border-gray-600">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-white">FleetFlow</h2>
                <p className="text-xs text-gray-300">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
            )}
          </div>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="text-gray-300 hover:text-white hover:bg-gray-600 p-1"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button> */}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-gray-800">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 py-2">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={activeTab === item.id}
                    className="data-[active=true]:bg-blue-600 data-[active=true]:text-white hover:bg-gray-600 text-gray-300 hover:text-white"
                  >
                    <button 
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isCollapsed ? 'justify-center' : 'justify-start'
                      } ${
                        activeTab === item.id 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="bg-gray-700 border-t border-gray-600 p-2">
        <Button 
          onClick={handleLogout} 
          variant="ghost" 
          className={`w-full text-gray-300 hover:text-white hover:bg-red-600 transition-colors duration-200 ${
            isCollapsed ? 'px-2' : 'px-3'
          }`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}