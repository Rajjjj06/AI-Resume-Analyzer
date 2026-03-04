import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Target,
  MessageSquare,
  History,
  Settings,
  LogOut,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/context/useAuth";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Upload Resume", url: "/dashboard/upload", icon: Upload },
  { title: "Analyze JD", url: "/dashboard/analyze-jd", icon: FileText },
  { title: "Match Results", url: "/dashboard/match-results", icon: Target },
  { title: "ATS Score", url: "/dashboard/ats-score", icon: BarChart3 },
  {
    title: "Interview Questions",
    url: "/dashboard/interview-questions",
    icon: MessageSquare,
  },
  { title: "History", url: "/dashboard/history", icon: History },
  { title: "Subscription", url: "/dashboard/subscription", icon: CreditCard },
];

const bottomItems = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const { signOutUser } = useAuth();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="min-h-8 min-w-8 h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-bold text-lg">ResumeAI</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {(!collapsed || isMobile) && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <NavLink
                to="/dashboard/settings"
                className="hover:bg-sidebar-accent/50"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              >
                <Settings className="h-4 w-4" />
                {(!collapsed || isMobile) && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <button
                onClick={signOutUser}
                className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-sidebar-accent/50 text-left"
              >
                <LogOut className="h-4 w-4" />
                {(!collapsed || isMobile) && <span>Logout</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
