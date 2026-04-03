import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const MAINTENANCE_TYPES = ['ตรวจสอบ', 'ทำความสะอาด', 'เปลี่ยนชิ้นส่วน', 'ปรับเทียบ', 'อื่นๆ']

export default function MaintenanceCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillEquipmentId = searchParams.get('equipment_id') || ''

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)

  const [form, setForm] = useState({
    equipment_id: prefillEquipmentId,
    maintenance_type: '',
    scheduled_date: '',
    description: '',
  })

  useEffect(() => {
    if (prefillEquipmentId) {
      loadEquipment(prefillEquipmentId)
    }
  }, [prefillEquipmentId])

  const loadEquipment = async (id) => {
    try {
      const { data } = await api.get(`/equipment/${id}`)
      setSelectedEquipment(data.data)
    } catch {
      toast.error('ไม่พบครุภัณฑ์')
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      setSearching(true)
      const { data } = await api.get('/equipment', { params: { q: searchQuery, limit: 10 } })
      setSearchResults(data.data || [])
    } catch {
      toast.error('ค้นหาไม่สำเร็จ')
    } finally {
      setSearching(false)
    }
  }

  const selectEquipment = (eq) => {
    setSelectedEquipment(eq)
    setForm((f) => ({ ...f, equipment_id: eq._id }))
    setSearchResults([])
    setSearchQuery('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.equipment_id) {
      toast.error('กรุณาเลือกครุภัณฑ์')
      return
    }
    if (!form.maintenance_type) {
      toast.error('กรุณาเลือกประเภทการบำรุงรักษา')
      return
    }
    if (!form.scheduled_date) {
      toast.error('กรุณาระบุวันที่กำหนด')
      return
    }

    try {
      setLoading(true)
      await api.post('/maintenance', form)
      toast.success('เพิ่มแผนบำรุงรักษาสำเร็จ')
      navigate('/maintenance')
    } catch (error) {
      toast.error(error.response?.data?.error || 'ไม่สามารถบันทึกได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/maintenance')}
          className="text-blue-600 hover:underline text-sm"
        >
          ← กลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900">เพิ่มแผนบำรุงรักษา</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        {/* เลือกครุภัณฑ์ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ครุภัณฑ์ <span className="text-red-500">*</span>
          </label>
          {selectedEquipment ? (
            <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-3 py-2">
              <div>
                <p className="font-medium text-gray-900">{selectedEquipment.name}</p>
                <p className="text-xs text-gray-500">{selectedEquipment.asset_code} | {selectedEquipment.department_name}</p>
              </div>
              {!prefillEquipmentId && (
                <button
                  type="button"
                  onClick={() => { setSelectedEquipment(null); setForm((f) => ({ ...f, equipment_id: '' })) }}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                  placeholder="ค้นหาชื่อหรือรหัสครุภัณฑ์..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="rounded-lg bg-gray-500 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50"
                >
                  {searching ? '...' : 'ค้นหา'}
                </button>
              </div>
              {searchResults.length > 0 && (
                <ul className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  {searchResults.map((eq) => (
                    <li
                      key={eq._id}
                      onClick={() => selectEquipment(eq)}
                      className="cursor-pointer px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <p className="font-medium text-sm">{eq.name}</p>
                      <p className="text-xs text-gray-500">{eq.asset_code} | {eq.department_name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ประเภทการบำรุงรักษา */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ประเภทการบำรุงรักษา <span className="text-red-500">*</span>
          </label>
          <select
            name="maintenance_type"
            value={form.maintenance_type}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">-- เลือกประเภท --</option>
            {MAINTENANCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* วันที่กำหนด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่กำหนด <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="scheduled_date"
            value={form.scheduled_date}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {/* รายละเอียด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดที่ต้องทำ</label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="ระบุรายละเอียดการบำรุงรักษาที่ต้องดำเนินการ..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/maintenance')}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  )
}
