export {};

declare global {
  interface Window {
    electron: {
      db: {
        // Business Tables
        queryBearings: () => Promise<any[]>;
        queryThreads: () => Promise<any[]>;
        queryBolts: () => Promise<any[]>;
        queryNuts: () => Promise<any[]>;
        queryWashers: () => Promise<any[]>;
        queryOringList: (standard?: string) => Promise<any[]>;
        queryOringSpec: (standard: string, code: string) => Promise<any>;
        queryOringMaterials: () => Promise<any[]>;
        queryMaterials: () => Promise<any[]>;
        queryMaterialEquivalents: (materialId?: string) => Promise<any[]>;
        queryGearModules: () => Promise<any[]>;
        queryManufacturers: () => Promise<any[]>;
        queryVendorParts: (domainCode?: string) => Promise<any[]>;
        globalSearch: (query: string, limit?: number) => Promise<any[]>;
        
        // Governance Tables
        querySources: () => Promise<any[]>;
        queryStandardSystems: () => Promise<any[]>;
        queryDatasets: () => Promise<any[]>;
        queryRules: (ruleCode?: string) => Promise<any>;
        queryDataVersion: () => Promise<Array<{
          standard_code: string;
          version: string;
          source: string;
          updated_at: string;
          checksum: string;
        }>>;
        
        // User Data
        addUserStandard: (id: string, category: string, data: any) => Promise<any>;
        queryUserStandards: (category: string) => Promise<any[]>;
        deleteUserStandard: (id: string) => Promise<any>;
        getUserStandard: (id: string) => Promise<any | null>;
        
        // Tools
        reverseIdentify: (type: string, measurements: Record<string, number>) => Promise<any[]>;
        importExcel: (templateType: string) => Promise<any>;
        downloadTemplate: (templateType: string, savePath: string) => Promise<boolean>;
      };
    };
  }
}
