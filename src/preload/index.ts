import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  db: {
    queryITGrade: (grade: string, sizeIndex: number) =>
      ipcRenderer.invoke("db-query-it-grade", grade, sizeIndex),
    queryDeviation: (
      type: "holes" | "shafts",
      position: string,
      sizeIndex: number,
    ) => ipcRenderer.invoke("db-query-deviation", type, position, sizeIndex),
    queryOringList: (standard: string) =>
      ipcRenderer.invoke("db-query-oring-list", standard),
    queryOringSpec: (standard: string, code: string) =>
      ipcRenderer.invoke("db-query-oring-spec", standard, code),
    queryBearings: () => ipcRenderer.invoke("db-query-bearings"),
    queryThreads: () => ipcRenderer.invoke("db-query-threads"),
    queryBolts: () => ipcRenderer.invoke("db-query-bolts"),
    queryDataVersion: () => ipcRenderer.invoke("db-query-data-version"),
    addUserStandard: (id: string, category: string, data: any) =>
      ipcRenderer.invoke("db-user-standard-add", id, category, data),
    queryUserStandards: (category: string) =>
      ipcRenderer.invoke("db-user-standard-query", category),
    deleteUserStandard: (id: string) =>
      ipcRenderer.invoke("db-user-standard-delete", id),
    getUserStandard: (id: string) =>
      ipcRenderer.invoke("db-user-standard-get", id),
    // FTS5 全文搜索
    search: (query: string, limit?: number) =>
      ipcRenderer.invoke("db-search", query, limit),
    // 材料查询
    queryMaterials: () =>
      ipcRenderer.invoke("db-query-materials"),
    // 逆向识别向导 - 测量反推标准规格
    reverseIdentify: (type: string, measurements: Record<string, number>) =>
      ipcRenderer.invoke("db-reverse-identify", type, measurements),
    // Excel 导入 - 主进程解析 + JSON Schema 校验
    importExcel: (templateType: string) =>
      ipcRenderer.invoke("excel-import", templateType),
    downloadTemplate: (templateType: string, savePath: string) =>
      ipcRenderer.invoke("excel-download-template", templateType, savePath),
  },
});
