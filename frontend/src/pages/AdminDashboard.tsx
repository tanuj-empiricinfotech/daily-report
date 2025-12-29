import { useState } from 'react';
import { useTeams } from '@/lib/query/hooks/useTeams';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { setSelectedTeam } from '@/store/slices/teamsSlice';
import { TeamManager } from '@/components/admin/TeamManager';
import { ProjectManager } from '@/components/admin/ProjectManager';
import { UserManager } from '@/components/admin/UserManager';
import { LogsViewer } from '@/components/admin/LogsViewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdminDashboard() {
  const { data: teams = [] } = useTeams();
  const selectedTeamId = useSelector((state: RootState) => state.teams.selectedTeamId);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<'teams' | 'projects' | 'users' | 'logs'>('teams');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Select
          value={selectedTeamId?.toString() || 'all'}
          onValueChange={(val) => dispatch(setSelectedTeam(val === 'all' ? null : parseInt(val, 10)))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id.toString()}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 ${activeTab === 'teams' ? 'border-b-2 border-primary' : ''}`}
        >
          Teams
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 ${activeTab === 'projects' ? 'border-b-2 border-primary' : ''}`}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-primary' : ''}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 ${activeTab === 'logs' ? 'border-b-2 border-primary' : ''}`}
        >
          Logs
        </button>
      </div>

      {activeTab === 'teams' && <TeamManager />}
      {activeTab === 'projects' && <ProjectManager />}
      {activeTab === 'users' && <UserManager />}
      {activeTab === 'logs' && <LogsViewer />}
    </div>
  );
}

