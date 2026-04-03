import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MainLayout({ children }) {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (!isAuthenticated) {
    return children
  }

  // Hide navigation on home page
  const isHomePage = location.pathname === '/'

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h1 className="text-lg font-bold sm:text-xl">ระบบบริหารจัดการพัสดุ</h1>
                <p className="text-xs text-blue-200">เทศบาลนครนครสวรรค์</p>
              </div>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* User Info */}
              <div className="hidden text-right sm:block">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      user?.role === 'admin'
                        ? 'bg-red-500 text-white'
                        : user?.role === 'manager'
                          ? 'bg-purple-500 text-white'
                          : user?.role === 'staff'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-500 text-white'
                    }`}
                  >
                    {user?.role === 'admin'
                      ? 'ผู้ดูแลระบบ'
                      : user?.role === 'manager'
                        ? 'ผู้จัดการ'
                        : user?.role === 'staff'
                          ? 'เจ้าหน้าที่'
                          : 'ผู้ดูข้อมูล'}
                  </span>
                </div>
                <div className="text-xs text-blue-200">{user?.department_name || '-'}</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg bg-white/20 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/30"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation - Only show on non-home pages */}
      {!isHomePage && (
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link to="/" className="text-blue-600 hover:text-blue-800">
                  หน้าแรก
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-600">
                {location.pathname.includes('/equipment') && 'ครุภัณฑ์'}
                {location.pathname.includes('/material') && 'วัสดุ'}
                {location.pathname.includes('/repair') && 'แจ้งซ่อม'}
                {location.pathname.includes('/settings') && 'ตั้งค่าระบบ'}
                {location.pathname.includes('/dashboard') && 'บันทึกกิจกรรม'}
              </li>
            </ol>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-gray-500 sm:px-6 lg:px-8">
          Copyright © งานจัดทำและพัฒนาระบบข้อมูลสารสนเทศ เทศบาลนครนครสวรรค์ by Manarider
        </div>
      </footer>
    </div>
  )
}
