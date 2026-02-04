/**
 * Application Sidebar Component
 * Uses shadcn sidebar primitives with app-specific navigation
 */

import { Link, useLocation } from 'react-router-dom';
import {
    IconLayoutDashboard,
    IconChartBar,
    IconClipboardList,
    IconFolder,
    IconUsers,
    IconSettings,
    IconLogout,
    IconPlus,
    IconMessageCircle,
} from '@tabler/icons-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/lib/query/hooks/useAuth';
import { GitHubLink } from './GitHubLink';

// Navigation items - Main section
const mainNavItems = [
    {
        title: 'Dashboard',
        url: '/',
        icon: IconLayoutDashboard,
        description: 'Overview & analytics',
    },
    {
        title: 'Daily Logs',
        url: '/logs',
        icon: IconClipboardList,
        description: 'Log your work',
    },
    {
        title: 'Chat',
        url: '/chat',
        icon: IconMessageCircle,
        description: 'AI chat with logs',
    },
];

// Admin-only navigation items
const adminNavItems = [
    {
        title: 'Projects',
        url: '/projects',
        icon: IconFolder,
        description: 'Manage projects',
    },
    {
        title: 'Team',
        url: '/team',
        icon: IconUsers,
        description: 'Manage team members',
    },
    {
        title: 'Analytics',
        url: '/analytics',
        icon: IconChartBar,
        description: 'Advanced analytics',
    },
];

// Bottom navigation items
const bottomNavItems = [
    {
        title: 'Settings',
        url: '/settings',
        icon: IconSettings,
        description: 'App settings',
    },
];

export function AppSidebar() {
    const location = useLocation();
    const { user, isAdmin } = useAuth();
    const { mutate: logout } = useLogout();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    const isActiveRoute = (url: string) => {
        if (url === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(url);
    };

    const handleLogout = () => {
        logout();
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            {/* Header - Brand */}
            <SidebarHeader className="border-b border-sidebar-border pb-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        D
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">Daily Report</span>
                            <span className="text-xs text-muted-foreground">Work Tracker</span>
                        </div>
                    )}
                </div>

                {/* Quick Create Button */}
                {!isCollapsed && (
                    <div className="flex items-center gap-2 mt-4 px-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 justify-start gap-2"
                            asChild
                        >
                            <Link to="/logs/create">
                                <IconPlus className="h-4 w-4" />
                                <span>Quick Create</span>
                            </Link>
                        </Button>
                    </div>
                )}
            </SidebarHeader>

            {/* Main Content */}
            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarMenu>
                        {mainNavItems.map((item) => (
                            <SidebarMenuItem key={item.url}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActiveRoute(item.url)}
                                    tooltip={item.title}
                                >
                                    <Link to={item.url}>
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Admin Section */}
                {isAdmin && (
                    <>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel>Admin</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {adminNavItems.map((item) => (
                                        <SidebarMenuItem key={item.url}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActiveRoute(item.url)}
                                                tooltip={item.title}
                                            >
                                                <Link to={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </>
                )}

                {/* More Section */}
                <SidebarSeparator />
                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {bottomNavItems.map((item) => (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActiveRoute(item.url)}
                                        tooltip={item.title}
                                    >
                                        <Link to={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer - User Profile */}
            <SidebarFooter className="border-t border-sidebar-border pt-4">
                {/* GitHub Link */}
                <GitHubLink />

                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {user?.name ? getInitials(user.name) : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!isCollapsed && (
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-sm font-medium truncate max-w-[120px]">
                                                {user?.name || 'User'}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                {user?.email || ''}
                                            </span>
                                        </div>
                                    )}
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="start"
                                className="w-[200px]"
                            >
                                <DropdownMenuItem asChild>
                                    <Link to="/settings" className="cursor-pointer">
                                        <IconSettings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-destructive cursor-pointer"
                                >
                                    <IconLogout className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
