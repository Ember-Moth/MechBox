import { defineStore } from "pinia";
import iso286Data from "../../../data/standards/tolerances/iso286.json";

export interface FavoriteItem {
  id: string;
  module: string;
  name: string;
  data: any;
  createdAt: number;
}

export const useStandardStore = defineStore("standard", {
  state: () => ({
    // Static data
    iso286Static: iso286Data,
    
    // Unit system
    unit: "mm" as "mm" | "inch",
    
    // Module data lists
    oringList: [] as any[],
    bearingList: [] as any[],
    boltList: [] as any[],
    threadList: [] as any[],
    
    // Favorites
    favorites: [] as FavoriteItem[],
    
    // Recent calculations
    recentCalculations: [] as any[],
  }),
  
  actions: {
    // Unit management
    setUnit(unit: "mm" | "inch") {
      this.unit = unit;
    },
    
    // Tolerance helpers
    getSizeRangeIndex(size: number): number {
      return this.iso286Static.size_ranges.findIndex((range: number[]) => {
        return size > range[0] && size <= range[1];
      });
    },
    
    async getITValue(grade: string, sizeIndex: number): Promise<number | null> {
      const res = await window.electron.db.queryITGrade(grade, sizeIndex);
      return res ? res.value / 1000 : null;
    },
    
    async getFundamentalDeviation(
      type: "holes" | "shafts",
      position: string,
      sizeIndex: number,
    ): Promise<number | null> {
      const res = await window.electron.db.queryDeviation(
        type,
        position,
        sizeIndex,
      );
      return res ? res.value / 1000 : null;
    },
    
    // Data fetching
    async fetchOringList(standard: string) {
      this.oringList = await window.electron.db.queryOringList(standard);
    },
    
    async fetchBearings() {
      this.bearingList = await window.electron.db.queryBearings();
    },
    
    async fetchBolts() {
      this.boltList = await window.electron.db.queryBolts();
    },
    
    async fetchThreads() {
      this.threadList = await window.electron.db.queryThreads();
    },
    
    // Favorites management
    addFavorite(module: string, name: string, data: any) {
      const id = `${module}_${Date.now()}`;
      this.favorites.unshift({
        id,
        module,
        name,
        data,
        createdAt: Date.now(),
      });
      // Keep only last 50 favorites
      if (this.favorites.length > 50) {
        this.favorites = this.favorites.slice(0, 50);
      }
    },
    
    removeFavorite(id: string) {
      this.favorites = this.favorites.filter(f => f.id !== id);
    },
    
    clearFavorites() {
      this.favorites = [];
    },
    
    // Recent calculations
    addRecentCalculation(module: string, name: string, data: any) {
      this.recentCalculations.unshift({
        id: `recent_${Date.now()}`,
        module,
        name,
        data,
        createdAt: Date.now(),
      });
      // Keep only last 20 recent items
      if (this.recentCalculations.length > 20) {
        this.recentCalculations = this.recentCalculations.slice(0, 20);
      }
    },
  },
});
