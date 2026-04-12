export {};

declare global {
  interface Window {
    electron: {
      db: {
        queryBearings: () => Promise<any[]>;
        queryThreads: () => Promise<any[]>;
        queryBolts: () => Promise<any[]>;
        queryOringList: (standard?: string) => Promise<any[]>;
        queryOringSpec: (standard: string, code: string) => Promise<any>;
        queryMaterials: () => Promise<any[]>;
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
        search: (query: string, limit?: number) => Promise<any[]>;
        reverseIdentify: (type: string, measurements: Record<string, number>) => Promise<any[]>;
        importExcel: (templateType: string) => Promise<any>;
        downloadTemplate: (templateType: string, savePath: string) => Promise<boolean>;
      };
    };
  }
}
