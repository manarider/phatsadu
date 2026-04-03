import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const SIDEBAR_ITEMS = [
  { path: '/', label: 'แดชบอร์ด', icon: '📊', roles: ['admin', 'manager', 'staff', 'viewer'] },
  { path: '/equipment', label: 'ครุภัณฑ์', icon: '💻', roles: ['admin', 'manager', 'staff', 'viewer'] },
  { path: '/material', label: 'วัสดุ', icon: '📦', roles: ['admin', 'manager', 'staff', 'viewer'] },
  { path: '/repair', label: 'แจ้งซ่อม', icon: '🔧', roles: ['admin', 'manager', 'staff', 'viewer'] },
  { path: '/maintenance', label: 'บำรุงรักษา', icon: '🔩', roles: ['admin', 'manager', 'staff', 'viewer'] },
  { path: '/sale', label: 'จำหน่ายครุภัณฑ์', icon: '🏷️', roles: ['admin', 'manager', 'staff', 'viewer'] },
  { path: '/settings', label: 'ตั้งค่า', icon: '⚙️', roles: ['admin'] },
  { path: '/audit-logs', label: 'บันทึกกิจกรรม', icon: '📋', roles: ['admin'] },
]

export default function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()

  const canAccess = (roles) => user && roles.includes(user.role)

  return (
    <aside className="w-64 border-r border-blue-200 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="p-4 border-b border-blue-200">
        <h2 className="text-lg font-bold text-blue-900">PAPP</h2>
        <p className="text-xs text-gray-600">ระบบบริหารพัสดุ</p>
      </div>

      <nav className="space-y-1 p-4">
        {SIDEBAR_ITEMS.map((item) =>
          canAccess(item.roles) ? (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-lg transition-colors ${
                location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-100'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ) : null
        )}
      </nav>

      <div className="absolute bottom-0 w-64 border-t border-blue-200 bg-white p-4">
        <p className="text-xs text-gray-600">
          {user?.first_name} {user?.last_name}
          <br />
          <span className="font-semibold">{user?.role}</span>
        </p>
      </div>
    </aside>
  )
}
