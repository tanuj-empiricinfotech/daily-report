import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Team } from '@/lib/api/types';

interface TeamsState {
  teams: Team[];
  selectedTeamId: number | null;
}

const initialState: TeamsState = {
  teams: [],
  selectedTeamId: null,
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setTeams: (state, action: PayloadAction<Team[]>) => {
      state.teams = action.payload;
    },
    addTeam: (state, action: PayloadAction<Team>) => {
      state.teams.push(action.payload);
    },
    updateTeam: (state, action: PayloadAction<Team>) => {
      const index = state.teams.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.teams[index] = action.payload;
      }
    },
    removeTeam: (state, action: PayloadAction<number>) => {
      state.teams = state.teams.filter((t) => t.id !== action.payload);
    },
    setSelectedTeam: (state, action: PayloadAction<number | null>) => {
      state.selectedTeamId = action.payload;
    },
  },
});

export const { setTeams, addTeam, updateTeam, removeTeam, setSelectedTeam } = teamsSlice.actions;
export default teamsSlice.reducer;

