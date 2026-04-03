import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const STATUS_LABELS = { pending: 'รอดำเนินการ', done: 'เสร็จสิ้น' }
const TYPE_COLORS = {
  ตรวจสอบ: 'bg-blue-100 text-blue-800',
  ทำความสะอาด: 'bg-cyan-100 text-cyan-800',
  เปลี่ยนชิ้นส่วน: 'bg-orange-100 text-orange-800',
  ปรับเทียบ: 'bg-purple-100 text-purple-800',
  อื่นๆ: 'bg-gray-100 text-gray-800',
}

function getStatusBadge(item) {
  if (item.status === 'done') return { label: 'เสร็จสิ้น', cls: 'bg-green-100 text-green-800' }
  const now = new Date()
  if (new Date(item.scheduled_date) < now) return { label: 'เกินกำหนด', cls: 'bg-red-100 text-red-800' }
  const diff = Math.ceil((new Date(item.scheduled_date) - now) / (1000 * 60 * 60 * 24))
  if (diff <= 7) return { label: `อีก ${diff} วัน`, cls: 'bg-yellow-100 text-yellow-800' }
  return { label: 'รอดำเนินการ', cls: 'bg-gray-100 text-gray-700' }
}

export default function MaintenanceListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '')
  const [completing, setCompleting] = useState(null)
  const [completeModal, setCompleteModal] = useState(null)
  const [completeForm, setCompleteForm] = useState({ completed_note: '', performed_by: '', cost: '' })

  const canManage = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'manager'

  useEffect(() => {
    fetchMaintenance()
  }, [filterStatus])

  const fetchMaintenance = async () => {
    try {
      setLoading(true)
      const params = { limit: 200 }
      if (filterStatus) params.status = filterStatus
      const { data } = await api.get('/maintenance', { params })
      setItems(data.data || [])
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/maintenance/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `maintenance-export-${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('ดาวน์โหลดไฟล์สำเร็จ')
    } catch {
      toast.error('ไม่สามารถ Export ได้')
    }
  }

  const openCompleteModal = (item) => {
    setCompleteModal(item)
    setCompleteForm({ completed_note: '', performed_by: user?.fullname || '', cost: '' })
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    if (!completeModal) return
    try {
      setCompleting(completeModal._id)
      await api.patch(`/maintenance/${completeModal._id}/complete`, {
        completed_note: completeForm.completed_note,
        performed_by: completeForm.performed_by,
        cost: Number(completeForm.cost || 0),
      })
      toast.success('บันทึกการบำรุงรักษาสำเร็จ')
      setCompleteModal(null)
      await fetchMaintenance()
    } catch (error) {
      toast.error(error.response?.data?.error || 'ไม่สามารถบันทึกได้')
    } finally {
      setCompleting(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบรายการนี้หรือไม่?')) return
    try {
      await api.delete(`/maintenance/${id}`)
      toast.success('ลบสำเร็จ')
      await fetchMaintenance()
    } catch {
      toast.error('ไม่สามารถลบได้')
    }
  }

  const overdueCount = items.filter(
    (i) => i.status === 'pending' && new Date(i.scheduled_date) < new Date()
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตารางบำรุงรักษาครุภัณฑ์</h1>
          {overdueCount > 0 && (
            <p className="text-sm text-red-600 font-medium">⚠️ เกินกำหนด {overdueCount} รายการ</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            📥 Export Excel
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => navigate('/maintenance/new')}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              + เพิ่มแผนบำรุงรักษา
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">-- ทุกสถานะ --</option>
          <option value="pending">รอดำเนินการ</option>
          <option value="done">เสร็จสิ้น</option>
        </select>
        <span className="flex items-center px-2 text-sm text-gray-600">{items.length} รายการ</span>
      </div>

      {loading ? (
        <div className="text-center text-gray-600">กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-600">ไม่พบข้อมูล</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">ครุภัณฑ์</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">ประเภท</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">วันที่กำหนด</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">สถานะ</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">หน่วยงาน</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">รายละเอียด</th>
                {canManage && (
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">การกระทำ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const badge = getStatusBadge(item)
                return (
                  <tr
                    key={item._id}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      badge.label === 'เกินกำหนด' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-2">
                      <p className="font-medium">{item.equipment_name}</p>
                      {item.equipment_asset_code && (
                        <p className="text-xs text-gray-500">{item.equipment_asset_code}</p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${TYPE_COLORS[item.maintenance_type] || 'bg-gray-100 text-gray-800'}`}>
                        {item.maintenance_type}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(item.scheduled_date).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {item.status === 'done' && item.completed_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.completed_date).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{item.department_name}</td>
                    <td className="px-4 py-2 text-gray-600 max-w-xs truncate">
                      {item.status === 'done' ? item.completed_note || '-' : item.description || '-'}
                    </td>
                    {canManage && (
                      <td className="px-4 py-2 text-center space-x-2">
                        {item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => openCompleteModal(item)}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            ✅ เสร็จแล้ว
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                        >
                          ลบ
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Complete Modal ─────────────────────────── */}
      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              บันทึกผลการบำรุงรักษา
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {completeModal.equipment_name} — {completeModal.maintenance_type}
            </p>
            <form onSubmit={handleComplete} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">ผู้ดำเนินการ</label>
                <input
                  type="text"
                  value={completeForm.performed_by}
                  onChange={(e) => setCompleteForm((f) => ({ ...f, performed_by: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ค่าใช้จ่าย (บาท)</label>
                <input
                  type="number"
                  min="0"
                  value={completeForm.cost}
                  onChange={(e) => setCompleteForm((f) => ({ ...f, cost: e.target.value }))}
                  placeholder="0"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">รายละเอียดที่ดำเนินการ</label>
                <textarea
                  rows={3}
                  value={completeForm.completed_note}
                  onChange={(e) => setCompleteForm((f) => ({ ...f, completed_note: e.target.value }))}
                  placeholder="อธิบายสิ่งที่ดำเนินการ..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!!completing}
                  className="flex-1 rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {completing ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button
                  type="button"
                  onClick={() => setCompleteModal(null)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
