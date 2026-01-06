/**
 * Top Navigation Bar Component
 * Contains breadcrumbs, search, and user actions
 */

import { useLocation } from 'react-router-dom';
import {
    IconSearch,
    IconBell,
    IconCommand,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ThemeToggle } from '@/components/ThemeToggle';

// Route to breadcrumb mapping
const routeLabels: Record<string, string> = {
    '/': 'Dashboard',
    '/logs': 'Daily Logs',
    '/logs/create': 'Create Log',
    '/projects': 'Projects',
    '/team': 'Team',
    '/analytics': 'Analytics',
    '/settings': 'Settings',
    '/admin': 'Admin Dashboard',
};

// Get breadcrumb items from pathname
function getBreadcrumbs(pathname: string): { label: string; path: string; isLast: boolean }[] {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; path: string; isLast: boolean }[] = [];

    // Always add home/dashboard
    if (pathname !== '/') {
        breadcrumbs.push({ label: 'Dashboard', path: '/', isLast: false });
    }

    let currentPath = '';
    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({
            label,
            path: currentPath,
            isLast: index === segments.length - 1,
        });
    });

    // If we're at root, just show Dashboard
    if (pathname === '/') {
        return [{ label: 'Dashboard', path: '/', isLast: true }];
    }

    return breadcrumbs;
}

interface TopBarProps {
    onSearchClick?: () => void;
}

export function TopBar({ onSearchClick }: TopBarProps) {
    const location = useLocation();
    const breadcrumbs = getBreadcrumbs(location.pathname);

    return (
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            {/* Left section - Sidebar trigger & Breadcrumbs */}
            <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4 mx-2" />

                {/* Breadcrumbs */}
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                            <BreadcrumbItem key={crumb.path}>
                                {crumb.isLast ? (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                ) : (
                                    <>
                                        <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                                        {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                                    </>
                                )}
                            </BreadcrumbItem>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* Right section - Actions */}
            <div className="flex items-center gap-2">
                {/* Search button */}
                <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={onSearchClick}
                >
                    <IconSearch className="h-4 w-4" />
                    <span className="text-sm">Search...</span>
                    <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <IconCommand className="h-3 w-3" />K
                    </kbd>
                </Button>

                {/* Mobile search */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={onSearchClick}
                >
                    <IconSearch className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <IconBell className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                    {/* Notification badge */}
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                </Button>

                {/* Theme Toggle */}
                <ThemeToggle />
            </div>
        </header>
    );
}
