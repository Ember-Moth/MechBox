import { defineStore } from "pinia";
import iso286Data from "../../../../data/standards/tolerances/iso286.json";
import as568Data from "../../../../data/standards/o-ring/as568.json";

export const useStandardStore = defineStore("standard", {
  state: () => ({
    iso286: iso286Data,
    as568: as568Data,
    unit: "mm" as "mm" | "inch",
  }),
  actions: {
    setUnit(unit: "mm" | "inch") {
      this.unit = unit;
    },
    // ... 公差方法保持不变
    getSizeRangeIndex(size: number): number {
      return this.iso286.size_ranges.findIndex((range) => {
        return size > range[0] && size <= range[1];
      });
    },
    getITValue(grade: string, sizeIndex: number): number | null {
      const itTable = this.iso286.it_grades as Record<string, number[]>;
      if (itTable[grade] && sizeIndex !== -1) {
        return itTable[grade][sizeIndex] / 1000;
      }
      return null;
    },
    getFundamentalDeviation(
      type: "holes" | "shafts",
      position: string,
      sizeIndex: number,
    ): number | null {
      const devTable = this.iso286.fundamental_deviations[type] as Record<
        string,
        number[]
      >;
      if (devTable[position] && sizeIndex !== -1) {
        return devTable[position][sizeIndex] / 1000;
      }
      return null;
    },
  },
});
