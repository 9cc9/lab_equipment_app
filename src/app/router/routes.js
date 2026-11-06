import { LoginPage } from 'pages/LoginPage'
import { HomePage } from 'pages/HomePage'
import { RoomEquipmentPage } from 'pages/RoomEquipmentPage'
import { ScanPage } from 'pages/ScanPage'
import { EquipmentDetailPage } from 'pages/EquipmentDetailPage'
import { ImportPage } from 'pages/ImportPage'
import { ChangeLogListPage } from 'pages/ChangeLogListPage'
import { BorrowCatalogPage } from 'pages/BorrowCatalogPage'
import { BorrowApplyPage } from 'pages/BorrowApplyPage'
import { BorrowMinePage } from 'pages/BorrowMinePage'
import { AdminBorrowPage } from 'pages/AdminBorrowPage'

export const routes = [
  { path: '/login', name: 'Login', component: LoginPage, public: true },
  { path: '/borrow', name: 'BorrowCatalog', component: BorrowCatalogPage, protected: true },
  { path: '/borrow/mine', name: 'BorrowMine', component: BorrowMinePage, protected: true },
  { path: '/borrow/:assetCode', name: 'BorrowApply', component: BorrowApplyPage, protected: true },
  { path: '/admin/borrow', name: 'AdminBorrow', component: AdminBorrowPage, protected: true },
  { path: '/', name: 'Home', component: HomePage, protected: true },
  { path: '/rooms/:roomCode', name: 'RoomEquipment', component: RoomEquipmentPage, protected: true },
  { path: '/scan', name: 'Scan', component: ScanPage, protected: true },
  { path: '/equipment/:assetCode', name: 'EquipmentDetail', component: EquipmentDetailPage, protected: true },
  { path: '/changes', name: 'ChangeLogList', component: ChangeLogListPage, protected: true },
  { path: '/admin/import', name: 'Import', component: ImportPage, protected: true },
]
