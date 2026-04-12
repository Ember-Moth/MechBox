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
  },
});
