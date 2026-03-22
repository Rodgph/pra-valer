import { create } from "zustand";
import { persist } from "zustand/middleware";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

interface BrowserState {
  urls: Record<string, string>;
  setPaneUrl: (paneId: string, url: string, skipBroadcast?: boolean) => void;
}

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => {
      // Listener para sincronia entre janelas
      listen<{ paneId: string; url: string }>("sync-browser-url", (event) => {
        const { paneId, url } = event.payload;
        if (get().urls[paneId] !== url) {
          set((state) => ({
            urls: { ...state.urls, [paneId]: url }
          }));
        }
      });

      return {
        urls: {},
        setPaneUrl: (paneId, url, skipBroadcast) => {
          set((state) => ({
            urls: { ...state.urls, [paneId]: url }
          }));

          if (!skipBroadcast) {
            invoke("emit_global_event", { 
              args: { event: "sync-browser-url", payload: { paneId, url } } 
            });
          }
        },
      };
    },
    { name: "social-os-browser-history" }
  )
);
