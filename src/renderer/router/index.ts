import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/tolerances', name: 'Tolerances', component: () => import('../views/tolerances/TolerancesPage.vue') },
  { path: '/seals', name: 'Seals', component: () => import('../views/seals/SealsPage.vue') },
  { path: '/bearings', name: 'Bearings', component: () => import('../views/bearings/BearingsPage.vue') },
  { path: '/bolts', name: 'Bolts', component: () => import('../views/bolts/BoltsPage.vue') },
  { path: '/drives', name: 'Drives', component: () => import('../views/DrivesPage.vue') },
  { path: '/gears', name: 'Gears', component: () => import('../views/GearsPage.vue') },
  { path: '/springs', name: 'Springs', component: () => import('../views/SpringsPage.vue') },
  { path: '/hydraulics', name: 'Hydraulics', component: () => import('../views/HydraulicsPage.vue') },
  { path: '/motors', name: 'Motors', component: () => import('../views/MotorsPage.vue') },
  { path: '/shafts', name: 'Shafts', component: () => import('../views/ShaftsPage.vue') },
  { path: '/units', name: 'Units', component: () => import('../views/UnitConverterPage.vue') },
  { path: '/materials', name: 'Materials', component: () => import('../views/MaterialLibraryPage.vue') },
  { path: '/standard-parts', name: 'StandardParts', component: () => import('../views/StandardPartsLibraryPage.vue') },
  { path: '/param-scan', name: 'ParamScan', component: () => import('../views/ParamScanPage.vue') },
  { path: '/monte-carlo', name: 'MonteCarlo', component: () => import('../views/MonteCarloPage.vue') },
  { path: '/dfm', name: 'DFM', component: () => import('../views/DFMAnalysisPage.vue') },
  { path: '/failure-diag', name: 'FailureDiagnosis', component: () => import('../views/FailureDiagnosisPage.vue') },
  { path: '/reverse-identify', name: 'ReverseIdentify', component: () => import('../views/ReverseIdentifyPage.vue') },
  { path: '/material-sub', name: 'MaterialSubstitution', component: () => import('../views/MaterialSubstitutionPage.vue') },
  { path: '/excel-import', name: 'ExcelImport', component: () => import('../views/ExcelImportPage.vue') },
  { path: '/latex-report', name: 'LaTeXReport', component: () => import('../views/LaTeXReportPage.vue') },
  { path: '/projects', name: 'Projects', component: () => import('../views/ProjectCenterPage.vue') },
  { path: '/reports', name: 'Reports', component: () => import('../views/ReportCenterPage.vue') },
  { path: '/bom-export', name: 'BOMExport', component: () => import('../views/BOMExportPage.vue') },
  { path: '/favorites', name: 'Favorites', component: () => import('../views/FavoritesPage.vue') },
  { path: '/settings', name: 'Settings', component: () => import('../views/SettingsPage.vue') },
  { path: '/about', name: 'About', component: () => import('../views/AboutPage.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export default router
