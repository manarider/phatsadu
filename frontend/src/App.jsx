import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedLayout from './components/common/ProtectedLayout'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import EquipmentListPage from './pages/equipment/EquipmentListPage'
import EquipmentDetailPage from './pages/equipment/EquipmentDetailPage'
import EquipmentCreatePage from './pages/equipment/EquipmentCreatePage'
import EquipmentEditPage from './pages/equipment/EquipmentEditPage'
import MaterialListPage from './pages/material/MaterialListPage'
import MaterialCreatePage from './pages/material/MaterialCreatePage'
import MaterialEditPage from './pages/material/MaterialEditPage'
import MaterialTransactionPage from './pages/material/MaterialTransactionPage'
import MaterialHistoryPage from './pages/material/MaterialHistoryPage'
import RepairListPage from './pages/repair/RepairListPage'
import RepairChatPage from './pages/repair/RepairChatPage'
import RepairCreatePage from './pages/repair/RepairCreatePage'
import RepairPrintPage from './pages/repair/RepairPrintPage'
import SettingsPage from './pages/settings/SettingsPage'
import MaintenanceListPage from './pages/maintenance/MaintenanceListPage'
import MaintenanceCreatePage from './pages/maintenance/MaintenanceCreatePage'
import AuditLogPage from './pages/audit/AuditLogPage'
import SaleListPage from './pages/sale/SaleListPage'
import SalePreparePage from './pages/sale/SalePreparePage'
import SaleHistoryPage from './pages/sale/SaleHistoryPage'

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Sarabun, sans-serif' },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth-callback" element={<AuthCallbackPage />} />

        {/* Protected routes — ใช้ Layout Route pattern ของ React Router v6 */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/equipment" element={<EquipmentListPage />} />
          <Route path="/equipment/new" element={<EquipmentCreatePage />} />
          <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
          <Route path="/equipment/:id/edit" element={<EquipmentEditPage />} />
          <Route path="/material" element={<MaterialListPage />} />
          <Route path="/material/new" element={<MaterialCreatePage />} />
          <Route path="/material/:id/edit" element={<MaterialEditPage />} />
          <Route path="/material/transactions" element={<MaterialTransactionPage />} />
          <Route path="/material/:id/history" element={<MaterialHistoryPage />} />
          <Route path="/repair" element={<RepairListPage />} />
          <Route path="/repair/new" element={<RepairCreatePage />} />
          <Route path="/repair/:id" element={<RepairChatPage />} />
          <Route path="/repair/:id/print" element={<RepairPrintPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/maintenance" element={<MaintenanceListPage />} />
          <Route path="/maintenance/new" element={<MaintenanceCreatePage />} />
          <Route path="/audit-logs" element={<AuditLogPage />} />
          <Route path="/sale" element={<SaleListPage />} />
          <Route path="/sale/prepare/:id" element={<SalePreparePage />} />
          <Route path="/sale/history" element={<SaleHistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
