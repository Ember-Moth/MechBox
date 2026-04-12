import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // 未来可以在这里暴露安全的 API，例如文件读取
})
