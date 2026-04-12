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
  },
});
