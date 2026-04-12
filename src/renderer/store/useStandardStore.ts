import { defineStore } from "pinia";
import iso286Data from "../../../../data/standards/tolerances/iso286.json";

export const useStandardStore = defineStore("standard", {
  state: () => ({
    iso286Static: iso286Data,
    unit: "mm" as "mm" | "inch",
    oringList: [] as any[],
    bearingList: [] as any[],
  }),
  actions: {
    setUnit(unit: "mm" | "inch") {
      this.unit = unit;
    },
    getSizeRangeIndex(size: number): number {
      return this.iso286Static.size_ranges.findIndex((range) => {
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
    async fetchOringList(standard: string) {
      this.oringList = await window.electron.db.queryOringList(standard);
    },
    async fetchBearings() {
      this.bearingList = await window.electron.db.queryBearings();
    },
  },
});
