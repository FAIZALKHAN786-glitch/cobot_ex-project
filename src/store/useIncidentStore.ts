import { create } from "zustand";
import type { Incident, IncidentFilters } from "@/types";

interface IncidentState {
  selectedIncident: Incident | null;
  filters: IncidentFilters;
  mapBounds: { north: number; south: number; east: number; west: number } | null;
  setSelectedIncident: (incident: Incident | null) => void;
  setFilters: (filters: Partial<IncidentFilters>) => void;
  clearFilters: () => void;
  setMapBounds: (bounds: IncidentState["mapBounds"]) => void;
}

export const useIncidentStore = create<IncidentState>((set) => ({
  selectedIncident: null,
  filters: {},
  mapBounds: null,
  setSelectedIncident: (incident) => set({ selectedIncident: incident }),
  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  clearFilters: () => set({ filters: {} }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
}));
