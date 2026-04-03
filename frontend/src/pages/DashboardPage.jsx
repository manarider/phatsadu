import { useEffect, useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [statsRes, alertsRes, pendingRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/low-stock-alerts'),
        api.get('/dashboard/pending-repairs'),
      ])
      setStats(statsRes.data.dashboard || {})
      setAlerts(alertsRes.data.data || [])
      setPending(pendingRes.data.data || [])
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-600 py-8">กำลังโหลด...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard icon="💻" title="ครุภัณฑ์ทั้งหมด" value={stats?.equipment?.total || 0} color="blue" />
        <StatCard icon="✅" title="ใช้งานได้" value={stats?.equipment?.usable || 0} color="green" />
        <StatCard icon="🔧" title="ส่งซ่อม" value={stats?.equipment?.maintenance || 0} color="yellow" />
        <StatCard icon="📦" title="วัสดุเหลือน้อย" value={stats?.alerts?.low_stock_count || 0} color="orange" />
        <StatCard
          icon="💰"
          title="ยอดรวมค่าซ่อม (บ.)"
          value={(stats?.repair_cost_total || 0).toLocaleString('th-TH')}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">⚠️ เตือนวัสดุเหลือน้อย</h2>
          {alerts.length === 0 ? (
            <p className="text-center text-gray-600">ไม่มีวัสดุที่เหลือน้อย ✅</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert._id} className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-orange-900">
                  <p className="font-medium">{alert.name}</p>
                  <p className="text-sm">เหลือ {alert.quantity} {alert.unit}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">🔧 รอการอนุมัติซ่อม</h2>
          {pending.length === 0 ? (
            <p className="text-center text-gray-600">ไม่มีรายการรอการอนุมัติ</p>
          ) : (
            <div className="space-y-2">
              {pending.map((item) => (
                <div key={item._id} className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900">
                  <p className="font-medium">{item.equipment_name}</p>
                  <p className="text-sm opacity-75">แจ้งโดย {item.requested_by}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, color }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  )
}
