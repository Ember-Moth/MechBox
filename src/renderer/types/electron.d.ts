export {};

declare global {
  interface Window {
    electron: {
      db: {
        queryITGrade: (
          grade: string,
          sizeIndex: number,
        ) => Promise<{ value: number } | undefined>;
        queryDeviation: (
          type: "holes" | "shafts",
          position: string,
          sizeIndex: number,
        ) => Promise<{ value: number } | undefined>;
        queryOringList: (standard: string) => Promise<any[]>;
        queryOringSpec: (standard: string, code: string) => Promise<any>;
        queryBearings: () => Promise<any[]>;
        queryThreads: () => Promise<any[]>;
        queryBolts: () => Promise<any[]>;
        queryDataVersion: () => Promise<Array<{
          standard_code: string;
          version: string;
          source: string;
          updated_at: string;
          checksum: string;
        }>>;
        addUserStandard: (id: string, category: string, data: any) => Promise<any>;
        queryUserStandards: (category: string) => Promise<any[]>;
        deleteUserStandard: (id: string) => Promise<any>;
        getUserStandard: (id: string) => Promise<any | null>;
      };
    };
  }
}
