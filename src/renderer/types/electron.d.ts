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
        // FTS5 模糊检索
        fuzzySearch: (table: string, query: string, limit?: number) => Promise<any[]>;
        // 逆向识别向导
        reverseIdentify: (type: string, measurements: Record<string, number>) => Promise<any[]>;
        // Excel 导入
        importExcel: (templateType: string) => Promise<any>;
        downloadTemplate: (templateType: string, savePath: string) => Promise<boolean>;
      };
    };
  }
}
