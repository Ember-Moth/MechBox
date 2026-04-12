import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  db: {
    // Bearings (V3)
    queryBearings: () => ipcRenderer.invoke("db-query-bearings"),
    
    // Threads (V3)
    queryThreads: () => ipcRenderer.invoke("db-query-threads"),
    
    // Bolts (V3)
    queryBolts: () => ipcRenderer.invoke("db-query-bolts"),
    
    // O-rings (V3)
    queryOringList: (standard?: string) =>
      ipcRenderer.invoke("db-query-oring-list", standard),
    queryOringSpec: (standard: string, code: string) =>
      ipcRenderer.invoke("db-query-oring-spec", standard, code),
    
    // Materials (V3)
    queryMaterials: () => ipcRenderer.invoke("db-query-materials"),
    
    // Data version
    queryDataVersion: () => ipcRenderer.invoke("db-query-data-version"),
    
    // User standards
    addUserStandard: (id: string, category: string, data: any) =>
      ipcRenderer.invoke("db-user-standard-add", id, category, data),
    queryUserStandards: (category: string) =>
      ipcRenderer.invoke("db-user-standard-query", category),
    deleteUserStandard: (id: string) =>
      ipcRenderer.invoke("db-user-standard-delete", id),
    getUserStandard: (id: string) =>
      ipcRenderer.invoke("db-user-standard-get", id),
    
    // Search (V3 FTS5)
    search: (query: string, limit?: number) =>
      ipcRenderer.invoke("db-search", query, limit),
    
    // Reverse identification
    reverseIdentify: (type: string, measurements: Record<string, number>) =>
      ipcRenderer.invoke("db-reverse-identify", type, measurements),
    
    // Excel import
    importExcel: (templateType: string) =>
      ipcRenderer.invoke("excel-import", templateType),
    downloadTemplate: (templateType: string, savePath: string) =>
      ipcRenderer.invoke("excel-download-template", templateType, savePath),
  },
});
