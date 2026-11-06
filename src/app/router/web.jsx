import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
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
import { BorrowApplicationDetailPage } from 'pages/BorrowApplicationDetailPage'
import { StaffBorrowPage } from 'pages/StaffBorrowPage'
import { ProtectedRoute } from 'components/protected-route'
import { RoleGuard } from 'components/role-guard'
import { StaffLayout } from 'components/staff-layout'
import { ROUTES } from 'shared/constants/routes'

const withAuth = (element) => (
  <ProtectedRoute>
    <RoleGuard>{element}</RoleGuard>
  </ProtectedRoute>
)

export const WebRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/borrow/mine" element={withAuth(<BorrowMinePage />)} />
      <Route path="/borrow/applications/:id" element={withAuth(<BorrowApplicationDetailPage />)} />
      <Route path="/borrow/:assetCode" element={withAuth(<BorrowApplyPage />)} />
      <Route path="/borrow" element={withAuth(<BorrowCatalogPage />)} />

      <Route path="/" element={withAuth(<StaffLayout />)}>
        <Route index element={<HomePage />} />
        <Route path="staff/borrow" element={<StaffBorrowPage />} />
        <Route path="rooms/:roomCode" element={<RoomEquipmentPage />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="equipment/:assetCode" element={<EquipmentDetailPage />} />
        <Route path="changes" element={<ChangeLogListPage />} />
        <Route path="admin/import" element={<ImportPage />} />
      </Route>

      <Route
        path="/admin/borrow"
        element={<Navigate to={`${ROUTES.STAFF_BORROW}?tab=approval`} replace />}
      />
    </Routes>
  </BrowserRouter>
)
