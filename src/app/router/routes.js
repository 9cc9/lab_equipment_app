import { LoginPage } from 'pages/LoginPage'
import { HomePage } from 'pages/HomePage'
import { RoomEquipmentPage } from 'pages/RoomEquipmentPage'
import { ScanPage } from 'pages/ScanPage'
import { EquipmentDetailPage } from 'pages/EquipmentDetailPage'
import { ImportPage } from 'pages/ImportPage'

export const routes = [
  { path: '/login', name: 'Login', component: LoginPage, public: true },
  { path: '/', name: 'Home', component: HomePage, protected: true },
  { path: '/rooms/:roomCode', name: 'RoomEquipment', component: RoomEquipmentPage, protected: true },
  { path: '/scan', name: 'Scan', component: ScanPage, protected: true },
  { path: '/equipment/:assetCode', name: 'EquipmentDetail', component: EquipmentDetailPage, protected: true },
  { path: '/admin/import', name: 'Import', component: ImportPage, protected: true },
]
