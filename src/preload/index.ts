import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  db: {
    // === Business Tables (V3 Schema) ===
    
    // Bearings
    queryBearings: () => ipcRenderer.invoke("db-query-bearings"),
    
    // Threads
    queryThreads: () => ipcRenderer.invoke("db-query-threads"),
    
    // Fasteners
    queryBolts: () => ipcRenderer.invoke("db-query-bolts"),
    queryNuts: () => ipcRenderer.invoke("db-query-nuts"),
    queryWashers: () => ipcRenderer.invoke("db-query-washers"),
    
    // O-rings
    queryOringList: (standard?: string) =>
      ipcRenderer.invoke("db-query-oring-list", standard),
    queryOringSpec: (standard: string, code: string) =>
      ipcRenderer.invoke("db-query-oring-spec", standard, code),
    queryOringMaterials: () => ipcRenderer.invoke("db-query-oring-materials"),
    queryOringRecommendation: (input: {
      standard?: string;
      dashCode?: string;
      crossSection?: number;
      application?: "radial-outer" | "radial-inner" | "axial";
      medium?: string;
      temperatureC?: number;
      pressureMpa?: number;
      pressurePsi?: number;
      hardness?: number;
      clearanceMm?: number;
    }) => ipcRenderer.invoke("db-query-oring-recommendation", input),
    
    // Materials
    queryMaterials: () => ipcRenderer.invoke("db-query-materials"),
    queryMaterialEquivalents: (materialId?: string) =>
      ipcRenderer.invoke("db-query-material-equivalents", materialId),
    
    // Gears
    queryGearModules: () => ipcRenderer.invoke("db-query-gear-modules"),
    
    // Manufacturers & Vendor Parts
    queryManufacturers: () => ipcRenderer.invoke("db-query-manufacturers"),
    queryVendorParts: (domainCode?: string) =>
      ipcRenderer.invoke("db-query-vendor-parts", domainCode),
    
    // Global Search (FTS5)
    globalSearch: (query: string, limit?: number) =>
      ipcRenderer.invoke("db-global-search", query, limit),
    
    // === Governance Tables (V3 Schema) ===
    querySources: () => ipcRenderer.invoke("db-query-sources"),
    queryStandardSystems: () => ipcRenderer.invoke("db-query-standard-systems"),
    queryDatasets: () => ipcRenderer.invoke("db-query-datasets"),
    queryRules: (ruleCode?: string) => ipcRenderer.invoke("db-query-rules", ruleCode),
    
    // Data version
    queryDataVersion: () => ipcRenderer.invoke("db-query-data-version"),
    
    // === User Data ===
    addUserStandard: (id: string, category: string, data: any) =>
      ipcRenderer.invoke("db-user-standard-add", id, category, data),
    queryUserStandards: (category: string) =>
      ipcRenderer.invoke("db-user-standard-query", category),
    deleteUserStandard: (id: string) =>
      ipcRenderer.invoke("db-user-standard-delete", id),
    getUserStandard: (id: string) =>
      ipcRenderer.invoke("db-user-standard-get", id),
    
    // === Tools ===
    reverseIdentify: (type: string, measurements: Record<string, number>) =>
      ipcRenderer.invoke("db-reverse-identify", type, measurements),
    
    importExcel: (templateType: string) =>
      ipcRenderer.invoke("excel-import", templateType),
    downloadTemplate: (templateType: string, savePath: string) =>
      ipcRenderer.invoke("excel-download-template", templateType, savePath),
  },
});
