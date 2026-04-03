import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_DISPLAY = {
  admin: 'ผู้ดูแลระบบ',
  manager: 'ผู้จัดการ',
  staff: 'เจ้าหน้าที่',
  viewer: 'ผู้ดูข้อมูล'
}

const MENU_ITEMS = [
  {
    title: 'ครุภัณฑ์',
    description: 'จัดการทะเบียนครุภัณฑ์',
    icon: '💻',
    path: '/equipment',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    textColor: 'text-blue-700',
    hoverColor: 'hover:bg-blue-100',
    roles: ['admin', 'manager', 'staff', 'viewer']
  },
  {
    title: 'แจ้งซ่อม',
    description: 'ใบแจ้งซ่อมครุภัณฑ์ทั้งหมด',
    icon: '🔧',
    path: '/repair',
    bgColor: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    textColor: 'text-orange-700',
    hoverColor: 'hover:bg-orange-100',
    roles: ['admin', 'manager', 'staff', 'viewer']
  },
  {
    title: 'วัสดุ',
    description: 'จัดการคลังวัสดุ',
    icon: '📦',
    path: '/material',
    bgColor: 'bg-green-50',
    iconBg: 'bg-green-100',
    textColor: 'text-green-700',
    hoverColor: 'hover:bg-green-100',
    roles: ['admin', 'manager', 'staff', 'viewer']
  },
  {
    title: 'บำรุงรักษา',
    description: 'ตารางและประวัติการบำรุงรักษาครุภัณฑ์',
    icon: '🔩',
    path: '/maintenance',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    textColor: 'text-amber-700',
    hoverColor: 'hover:bg-amber-100',
    roles: ['admin', 'manager', 'staff', 'viewer']
  },
  {
    title: 'จำหน่าย',
    description: 'จัดการรายการจำหน่ายครุภัณฑ์',
    icon: '🏷️',
    path: '/sale',
    bgColor: 'bg-rose-50',
    iconBg: 'bg-rose-100',
    textColor: 'text-rose-700',
    hoverColor: 'hover:bg-rose-100',
    roles: ['admin', 'manager', 'staff', 'viewer']
  },
  {
    title: 'ตั้งค่าระบบ',
    description: 'จัดการหมวดหมู่ / ประเภทครุภัณฑ์ / ประเภทวัสดุ',
    icon: '⚙️',
    path: '/settings',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    textColor: 'text-purple-700',
    hoverColor: 'hover:bg-purple-100',
    roles: ['admin']
  },
  {
    title: 'บันทึกกิจกรรม',
    description: 'ประวัติการใช้งานระบบ — เห็นได้เฉพาะ admin',
    icon: '📋',
    path: '/audit-logs',
    bgColor: 'bg-gray-50',
    iconBg: 'bg-gray-100',
    textColor: 'text-gray-700',
    hoverColor: 'hover:bg-gray-100',
    roles: ['admin']
  }
]

export default function HomePage() {
  const { user } = useAuth()

  const canAccess = (roles) => user && roles.includes(user.role)

  return (
    <div className="space-y-6">
      {/* Menu Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MENU_ITEMS.map((item) =>
          canAccess(item.roles) ? (
            <Link
              key={item.path}
              to={item.path}
              className={`group rounded-xl border border-gray-200 ${item.bgColor} p-6 shadow-sm transition-all ${item.hoverColor} hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${item.iconBg}`}>
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${item.textColor}`}>{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            </Link>
          ) : null
        )}
      </div>
    </div>
  )
}
