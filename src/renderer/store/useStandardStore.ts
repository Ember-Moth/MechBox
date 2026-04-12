import { defineStore } from "pinia";
import iso286Data from "../../../data/standards/tolerances/iso286.json";

export interface FavoriteItem {
  id: string;
  module: string;
  name: string;
  data: any;
  createdAt: number;
}

type ITGradeCode = keyof typeof iso286Data.it_grades;
type HoleDeviationCode = keyof typeof iso286Data.fundamental_deviations.holes;
type ShaftDeviationCode = keyof typeof iso286Data.fundamental_deviations.shafts;

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
    
    getITValue(grade: string, sizeIndex: number): number | null {
      // Use static ISO 286 data directly (Section 13 fix: removed broken IPC calls)
      const grades = this.iso286Static.it_grades;
      if (!grades) return null;

      const gradeKey = grade as ITGradeCode;
      const gradeData = grades[gradeKey];
      if (!gradeData || sizeIndex < 0 || sizeIndex >= gradeData.length) return null;

      return gradeData[sizeIndex]; // Value is in μm
    },

    getFundamentalDeviation(
      type: "holes" | "shafts",
      position: string,
      sizeIndex: number,
    ): number | null {
      // Use static ISO 286 data directly (Section 13 fix: removed broken IPC calls)
      const posData =
        type === "holes"
          ? this.iso286Static.fundamental_deviations.holes[position as HoleDeviationCode]
          : this.iso286Static.fundamental_deviations.shafts[position as ShaftDeviationCode];
      if (!posData || sizeIndex < 0 || sizeIndex >= posData.length) return null;

      return posData[sizeIndex]; // Value is in μm
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
