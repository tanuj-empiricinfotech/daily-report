/**
 * GitHub Link Component
 * Displays a link to the GitHub repository with star count
 */

import { useEffect, useState } from 'react';
import { IconBrandGithub } from '@tabler/icons-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';

// Constants
const GITHUB_REPO_OWNER = 'tanuj-empiricinfotech';
const GITHUB_REPO_NAME = 'daily-report';
const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;

interface GitHubRepoData {
    stargazers_count: number;
}

function formatStarCount(count: number): string {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
}

async function fetchStarCount(): Promise<number> {
    try {
        const response = await fetch(GITHUB_API_URL);

        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status}`);
        }

        const data: GitHubRepoData = await response.json();
        return data.stargazers_count;
    } catch (error) {
        console.error('Failed to fetch GitHub star count:', error);
        return 0;
    }
}

export function GitHubLink() {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    const [starCount, setStarCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const loadStarCount = async () => {
            const count = await fetchStarCount();

            if (isMounted) {
                setStarCount(count);
                setIsLoading(false);
            }
        };

        loadStarCount();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleClick = () => {
        window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer');
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    onClick={handleClick}
                    tooltip="Star on GitHub"
                    className="cursor-pointer hover:bg-sidebar-accent"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
                        <IconBrandGithub className="h-4 w-4" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col items-start text-left flex-1">
                            <span className="text-sm font-medium">Star on GitHub</span>
                            <span className="text-xs text-muted-foreground">
                                {isLoading ? 'Loading...' : `${formatStarCount(starCount)} stars`}
                            </span>
                        </div>
                    )}
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
