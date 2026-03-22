import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Game {
  appId: string;
  name: string;
  isSteam?: boolean;
}

interface SteamAccount {
  name: string;
  avatar: string;
  steamId: string;
  apiKey: string;
}

interface GamesState {
  favorites: Game[];
  isSteamConnected: boolean;
  steamUser: SteamAccount | null;
  
  addFavorite: (game: Game) => void;
  removeFavorite: (appId: string) => void;
  setSteamData: (data: SteamAccount) => void;
  disconnectSteam: () => void;
}

export const useGamesStore = create<GamesState>()(
  persist(
    (set) => ({
      favorites: [],
      isSteamConnected: false,
      steamUser: null,

      addFavorite: (game) => set((state) => ({ 
        favorites: state.favorites.some(g => g.appId === game.appId) 
          ? state.favorites 
          : [...state.favorites, game] 
      })),
      
      removeFavorite: (appId) => set((state) => ({ 
        favorites: state.favorites.filter((g) => g.appId !== appId) 
      })),

      setSteamData: (data) => set({ isSteamConnected: true, steamUser: data }),
      disconnectSteam: () => set({ isSteamConnected: false, steamUser: null }),
    }),
    { name: "social-os-games-v2" }
  )
);
