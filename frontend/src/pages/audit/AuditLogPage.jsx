import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'

const MODULES = [
  { value: '', label: 'ทุกโมดูล' },
  { value: 'auth', label: 'ล็อกอิน/ออก' },
  { value: 'equipment', label: 'ครุภัณฑ์' },
  { value: 'material', label: 'วัสดุ' },
  { value: 'transaction', label: 'ธุรกรรมวัสดุ' },
  { value: 'repair', label: 'แจ้งซ่อม' },
  { value: 'chat', label: 'แชท' },
  { value: 'settings', label: 'ตั้งค่า' },
  { value: 'system', label: 'ระบบ' },
]

const ACTIONS = [
  { value: '', label: 'ทุกการกระทำ' },
  { value: 'create', label: 'สร้าง' },
  { value: 'update', label: 'แก้ไข' },
  { value: 'delete', label: 'ลบ' },
  { value: 'approve', label: 'อนุมัติ' },
  { value: 'reject', label: 'ปฏิเสธ' },
  { value: 'login', label: 'เข้าสู่ระบบ' },
  { value: 'logout', label: 'ออกจากระบบ' },
  { value: 'import', label: 'นำเข้าข้อมูล' },
]

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  approve: 'bg-teal-100 text-teal-800',
  reject: 'bg-orange-100 text-orange-800',
  login: 'bg-purple-100 text-purple-800',
  logout: 'bg-gray-100 text-gray-800',
  import: 'bg-yellow-100 text-yellow-800',
}

function formatDateTime(dt) {
  if (!dt) return '-'
  const d = new Date(dt)
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const LIMIT_OPTIONS = [50, 100, 200, 500, 1000]

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 100, totalPages: 1 })
  const [expandedId, setExpandedId] = useState(null)
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    api.get('/departments').then(({ data }) => {
      setDepartments(data.data || [])
    }).catch(() => {})
  }, [])

  const [filters, setFilters] = useState({
    module: '',
    action: '',
    actor_username: '',
    department_name: '',
    date_from: '',
    date_to: '',
    q: '',
    limit: 100,
  })

  const [pendingFilters, setPendingFilters] = useState({ ...filters })

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', page)
        params.set('limit', filters.limit)
        if (filters.module) params.set('module', filters.module)
        if (filters.action) params.set('action', filters.action)
        if (filters.actor_username) params.set('actor_username', filters.actor_username)
        if (filters.department_name) params.set('department_name', filters.department_name)
        if (filters.date_from) params.set('date_from', filters.date_from)
        if (filters.date_to) params.set('date_to', filters.date_to)
        if (filters.q) params.set('q', filters.q)

        const { data } = await api.get(`/audit-logs?${params.toString()}`)
        setLogs(data.data || [])
        setPagination(data.pagination || { total: 0, page: 1, limit: 100, totalPages: 1 })
      } catch (err) {
        console.error('Failed to fetch audit logs:', err)
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters({ ...pendingFilters })
  }

  const handleReset = () => {
    const reset = {
      module: '',
      action: '',
      actor_username: '',
      department_name: '',
      date_from: '',
      date_to: '',
      q: '',
      limit: 100,
    }
    setPendingFilters(reset)
    setFilters(reset)
  }

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">บันทึกกิจกรรม</h1>
        <p className="text-sm text-gray-500 mt-1">ประวัติการดำเนินการทั้งหมดในระบบ</p>
      </div>

      {/* Filter Panel */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* keyword */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ค้นหา</label>
            <input
              type="text"
              placeholder="ชื่อผู้ใช้, รายละเอียด..."
              value={pendingFilters.q}
              onChange={(e) => setPendingFilters({ ...pendingFilters, q: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* module */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">โมดูลงาน</label>
            <select
              value={pendingFilters.module}
              onChange={(e) => setPendingFilters({ ...pendingFilters, module: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MODULES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* action */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">การกระทำ</label>
            <select
              value={pendingFilters.action}
              onChange={(e) => setPendingFilters({ ...pendingFilters, action: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* actor */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ผู้ดำเนินการ</label>
            <input
              type="text"
              placeholder="username"
              value={pendingFilters.actor_username}
              onChange={(e) =>
                setPendingFilters({ ...pendingFilters, actor_username: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* department */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">หน่วยงาน</label>
            <select
              value={pendingFilters.department_name}
              onChange={(e) =>
                setPendingFilters({ ...pendingFilters, department_name: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทุกหน่วยงาน</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* date_from */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={pendingFilters.date_from}
              onChange={(e) => setPendingFilters({ ...pendingFilters, date_from: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* date_to */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={pendingFilters.date_to}
              onChange={(e) => setPendingFilters({ ...pendingFilters, date_to: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* limit */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">แถวต่อหน้า</label>
            <select
              value={pendingFilters.limit}
              onChange={(e) =>
                setPendingFilters({ ...pendingFilters, limit: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LIMIT_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l} รายการ
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            ค้นหา
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
          >
            ล้างตัวกรอง
          </button>
        </div>
      </form>

      {/* Summary bar */}
      <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
        <span>
          พบ <strong>{pagination.total.toLocaleString()}</strong> รายการ
          {pagination.totalPages > 1 && (
            <span>
              {' '}· หน้า {pagination.page}/{pagination.totalPages}
            </span>
          )}
        </span>
        {pagination.totalPages > 1 && (
          <div className="flex gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="px-2 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              ← ก่อนหน้า
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="px-2 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              ถัดไป →
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40 text-gray-500">กำลังโหลด...</div>
        ) : logs.length === 0 ? (
          <div className="flex justify-center items-center h-40 text-gray-400">
            ไม่พบรายการบันทึกกิจกรรม
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 whitespace-nowrap">#</th>
                  <th className="px-4 py-3 whitespace-nowrap">วันเวลา</th>
                  <th className="px-4 py-3 whitespace-nowrap">ผู้ดำเนินการ</th>
                  <th className="px-4 py-3 whitespace-nowrap">หน่วยงาน</th>
                  <th className="px-4 py-3 whitespace-nowrap">โมดูล</th>
                  <th className="px-4 py-3 whitespace-nowrap">การกระทำ</th>
                  <th className="px-4 py-3">รายละเอียด</th>
                  <th className="px-4 py-3 whitespace-nowrap">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log, idx) => (
                  <>
                    <tr
                      key={log._id}
                      onClick={() => toggleExpand(log._id)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-400 text-xs">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 text-xs">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="font-medium text-gray-800">{log.actor_username || '-'}</div>
                        <div className="text-xs text-gray-400">{log.actor_role}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-600 text-xs">
                        {log.department_name || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 text-xs">
                        {log.module_label}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {log.action_label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600 text-xs max-w-xs truncate">
                        {log.message || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-400 text-xs">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                    {expandedId === log._id && (
                      <tr key={log._id + '-expand'} className="bg-blue-50">
                        <td colSpan={8} className="px-6 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-semibold text-gray-700 mb-1">รายละเอียดเพิ่มเติม</p>
                              <table className="w-full text-gray-600">
                                <tbody>
                                  <tr>
                                    <td className="pr-3 text-gray-400 py-0.5">target_id</td>
                                    <td>{log.target_id || '-'}</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-3 text-gray-400 py-0.5">collection</td>
                                    <td>{log.target_collection || '-'}</td>
                                  </tr>
                                  <tr>
                                    <td className="pr-3 text-gray-400 py-0.5">user_agent</td>
                                    <td className="break-all">{log.user_agent || '-'}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700 mb-1">ข้อมูลก่อน/หลัง</p>
                              <p className="text-gray-400 italic">
                                {log.before_data || log.after_data
                                  ? 'มีข้อมูล (เก็บใน database)'
                                  : 'ไม่มีข้อมูลก่อน/หลัง'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => {
            const p =
              pagination.totalPages <= 10
                ? i + 1
                : pagination.page <= 6
                ? i + 1
                : pagination.page + i - 5
            if (p < 1 || p > pagination.totalPages) return null
            return (
              <button
                key={p}
                onClick={() => fetchLogs(p)}
                className={`px-3 py-1 text-xs rounded border ${
                  p === pagination.page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
