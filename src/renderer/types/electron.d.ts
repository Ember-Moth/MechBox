export {}

declare global {
  interface Window {
    electron: {
      db: {
        queryITGrade: (grade: string, sizeIndex: number) => Promise<{ value: number } | undefined>;
        queryDeviation: (type: 'holes' | 'shafts', position: string, sizeIndex: number) => Promise<{ value: number } | undefined>;
        queryOringList: (standard: string) => Promise<any[]>;
        queryOringSpec: (standard: string, code: string) => Promise<any>;
      }
    }
  }
}
