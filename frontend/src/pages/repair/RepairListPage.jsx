import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function RepairListPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState(new Set())
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchRepairs()
    setSelected(new Set())
  }, [filter])

  const fetchRepairs = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/repairs', { params: { status: filter } })
      setItems(data.data || [])
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลแจ้งซ่อมได้')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/export/repair', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `repair-export-${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('ดาวน์โหลดไฟล์สำเร็จ')
    } catch (error) {
      toast.error('ไม่สามารถ Export ข้อมูลได้')
    }
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((i) => i._id)))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteReason.trim()) { toast.error('กรุณากรอกเหตุผล'); return }
    setDeleting(true)
    try {
      const { data } = await api.delete('/repairs', {
        data: { ids: [...selected], reason: deleteReason },
      })
      toast.success(`ลบสำเร็จ ${data.deleted_count} รายการ (คืนสถานะครุภัณฑ์เป็น ใช้งานได้)`)
      setSelected(new Set())
      setDeleteDialog(false)
      setDeleteReason('')
      fetchRepairs()
    } catch (error) {
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setDeleting(false)
    }
  }

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  const statusLabel = {
    pending: 'รอการอนุมัติ',
    approved: 'อนุมัติแล้ว',
    in_progress: 'กำลังซ่อม',
    completed: 'เสร็จสิ้น',
    rejected: 'ไม่อนุมัติ',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">แจ้งซ่อม</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            📥 Export Excel
          </button>
          <button
            type="button"
            onClick={() => navigate('/repair/new')}
            className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700"
          >
            + แจ้งซ่อมใหม่
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusLabel).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Admin delete toolbar */}
      {isAdmin && selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
          <span className="text-sm font-medium text-red-800">เลือกแล้ว {selected.size} รายการ</span>
          <button
            type="button"
            onClick={() => setDeleteDialog(true)}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            🗑 ลบรายการที่เลือก
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ยกเลิกการเลือก
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 font-semibold text-gray-900">ยืนยันการลบ {selected.size} รายการ</h3>
            <p className="mb-3 text-sm text-gray-600">
              ครุภัณฑ์ที่เกี่ยวข้องจะถูกเปลี่ยนสถานะเป็น <strong>ใช้งานได้</strong> โดยอัตโนมัติ
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เหตุผลในการลบ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="ระบุเหตุผล..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting || !deleteReason.trim()}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
              <button
                type="button"
                onClick={() => { setDeleteDialog(false); setDeleteReason('') }}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600">กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-600">ไม่มีข้อมูลแจ้งซ่อม</div>
      ) : (
        <>
          {isAdmin && items.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selected.size === items.length}
                onChange={toggleSelectAll}
                className="rounded"
              />
              เลือกทั้งหมด ({items.length} รายการ)
            </label>
          )}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item._id}
                className={`rounded-lg border bg-white p-4 hover:shadow-md transition-shadow ${selected.has(item._id) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  {isAdmin && (
                    <input
                      type="checkbox"
                      checked={selected.has(item._id)}
                      onChange={() => toggleSelect(item._id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 rounded flex-shrink-0"
                    />
                  )}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/repair/${item._id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {item.is_bulk ? (
                          <>
                            <p className="font-semibold text-gray-900">
                              แจ้งซ่อมหลายรายการ ({item.equipment_items?.length || 0} รายการ)
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              รหัสครุภัณฑ์: {item.equipment_items?.map((e) => e.asset_code).filter(Boolean).join(', ') || '-'}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900">{item.equipment_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              รหัสครุภัณฑ์: {item.equipment_asset_code || '-'}
                              {item.department_name && <span className="ml-3">หน่วยงาน: {item.department_name}</span>}
                            </p>
                          </>
                        )}
                        <p className="text-sm text-gray-600 mt-1">{item.problem_detail}</p>
                        <p className="mt-1 text-xs text-gray-500">แจ้งโดย: {item.requested_by}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm font-medium whitespace-nowrap ml-2 ${statusColor[item.status]}`}>
                        {statusLabel[item.status]}
                      </span>
                    </div>
                    {item.unread_count > 0 && (
                      <div className="mt-2 inline-block rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        {item.unread_count} ข้อความใหม่
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

