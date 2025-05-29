
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
import { Dashboard, User, Settings, LogOut, Truck } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { authService } from "../services/auth"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

interface AppSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: Dashboard,
  },
  {
    id: "profile",
    title: "Profile",
    icon: User,
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

  const handleLogout = () => {
    authService.logout()
    setUser(null)
    navigate('/login')
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Truck className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold">Driver Management</h2>
            <p className="text-sm text-muted-foreground">
              {user?.first_name} {user?.last_name}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    isActive={activeTab === item.id}
                  >
                    <button 
                      onClick={() => onTabChange(item.id)}
                      className="w-full flex items-center gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
