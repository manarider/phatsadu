import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const STATUS_COLOR = {
  'ชำรุด': 'bg-red-100 text-red-700',
  'รอตัดจำหน่าย': 'bg-orange-100 text-orange-700',
  'ใช้งานได้': 'bg-green-100 text-green-700',
  'อยู่ระหว่างซ่อม': 'bg-yellow-100 text-yellow-700',
  'จำหน่ายแล้ว': 'bg-gray-100 text-gray-500',
}

const STATUSES = ['ใช้งานได้', 'ชำรุด', 'อยู่ระหว่างซ่อม', 'รอตัดจำหน่าย', 'จำหน่ายแล้ว']

export default function SaleListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [statusEditing, setStatusEditing] = useState(null) // equipment _id
  const [savingStatus, setSavingStatus] = useState(false)
  const [search, setSearch] = useState('')

  const canWrite = ['admin', 'manager', 'staff'].includes(user?.role)

  const filtered = search.trim()
    ? items.filter((item) => {
        const q = search.trim().toLowerCase()
        return (
          (item.asset_code || '').toLowerCase().includes(q) ||
          (item.name || '').toLowerCase().includes(q) ||
          (item.equipment_type_name || '').toLowerCase().includes(q) ||
          (item.department_name || '').toLowerCase().includes(q) ||
          (item.status || '').toLowerCase().includes(q)
        )
      })
    : items

  useEffect(() => { fetchPending() }, [])

  const fetchPending = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/sale/pending')
      setItems(data.data || [])
      setSelected(new Set())
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((i) => i._id)))
  }

  const handleStatusChange = async (id, newStatus) => {
    setSavingStatus(true)
    try {
      await api.patch(`/sale/equipment/${id}/status`, { status: newStatus })
      toast.success('เปลี่ยนสถานะแล้ว')
      setStatusEditing(null)
      fetchPending()
    } catch (err) {
      toast.error(err.response?.data?.error || 'เปลี่ยนสถานะไม่สำเร็จ')
    } finally {
      setSavingStatus(false)
    }
  }

  const handlePrepare = async () => {
    if (!selected.size) return toast.error('กรุณาเลือกครุภัณฑ์')
    try {
      const { data } = await api.post('/sale/draft', {
        equipment_ids: [...selected],
      })
      navigate(`/sale/prepare/${data.data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'ไม่สามารถสร้างรายการได้')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">จำหน่ายครุภัณฑ์</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/sale/history')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            📜 ประวัติจำหน่าย
          </button>
          {canWrite && selected.size > 0 && (
            <button
              type="button"
              onClick={handlePrepare}
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
            >
              🗑️ เตรียมจำหน่าย ({selected.size} รายการ)
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        รายการครุภัณฑ์ที่มีสถานะ <span className="font-medium text-red-600">ชำรุด</span> หรือ{' '}
        <span className="font-medium text-orange-600">รอตัดจำหน่าย</span> — เลือกเพื่อเตรียมจำหน่าย
      </p>

      {/* Global Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา รหัส / ชื่อ / ประเภท / หน่วยงาน / สถานะ..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-400">
          {search ? `ไม่พบผลลัพธ์สำหรับ "${search}"` : 'ไม่มีครุภัณฑ์ที่ต้องจำหน่าย'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-center">
                  {canWrite && (
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                    />
                  )}
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">รหัสครุภัณฑ์</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">ชื่อ</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">ประเภท</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">หน่วยงาน</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">
                    {canWrite && (
                      <input
                        type="checkbox"
                        checked={selected.has(item._id)}
                        onChange={() => toggleSelect(item._id)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono whitespace-nowrap">{item.asset_code}</td>
                  <td className="px-4 py-2 break-words min-w-[180px]">{item.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.equipment_type_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.department_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {canWrite && statusEditing === item._id ? (
                      <select
                        autoFocus
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        defaultValue={item.status}
                        disabled={savingStatus}
                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                        onBlur={() => setStatusEditing(null)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${STATUS_COLOR[item.status] || 'bg-gray-100 text-gray-600'}`}
                        title={canWrite ? 'คลิกเพื่อเปลี่ยนสถานะ' : ''}
                        onClick={() => canWrite && setStatusEditing(item._id)}
                      >
                        {item.status}
                        {canWrite && <span className="ml-1 opacity-50">▼</span>}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
