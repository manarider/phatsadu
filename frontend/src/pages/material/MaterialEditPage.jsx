import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function MaterialEditPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [materialTypes, setMaterialTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    material_type_id: '',
    unit: '',
    quantity: 0,
    min_quantity: 0,
    note: '',
    department_name: '',
  })

  useEffect(() => {
    fetchMaterialTypes()
    fetchMaterial()
    if (isAdmin) fetchDepartments()
  }, [id])

  const fetchMaterialTypes = async () => {
    try {
      const { data } = await api.get('/materials/types')
      setMaterialTypes(data.data || [])
    } catch {
      toast.error('ไม่สามารถโหลดประเภทวัสดุได้')
    }
  }

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments')
      setDepartments(data.data || [])
    } catch {}
  }

  const fetchMaterial = async () => {
    try {
      const { data } = await api.get(`/materials/${id}`)
      const material = data.data
      setFormData({
        name: material.name || '',
        material_type_id: material.material_type_id?._id || material.material_type_id || '',
        unit: material.unit || '',
        quantity: material.quantity || 0,
        min_quantity: material.min_quantity || 0,
        note: material.note || '',
        department_name: material.department_name || '',
      })
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลวัสดุได้')
      navigate('/material')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.material_type_id || !formData.unit) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
      return
    }
    setLoading(true)
    try {
      await api.put(`/materials/${id}`, formData)
      toast.success('แก้ไขวัสดุสำเร็จ')
      navigate('/material')
    } catch (error) {
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <button
        type="button"
        onClick={() => navigate('/material')}
        className="text-blue-600 hover:underline text-sm"
      >
        ← กลับไปรายการ
      </button>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">แก้ไขวัสดุ</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ชื่อวัสดุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อวัสดุ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* หน่วยงานเจ้าของวัสดุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยงานเจ้าของวัสดุ</label>
            {isAdmin ? (
              <select
                value={formData.department_name}
                onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- เลือกหน่วยงาน --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.department_name}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            )}
          </div>

          {/* ประเภทวัสดุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเภทวัสดุ <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.material_type_id}
              onChange={(e) => setFormData({ ...formData, material_type_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- เลือกประเภท --</option>
              {materialTypes.map((type) => (
                <option key={type._id} value={type._id}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* หน่วยนับ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หน่วยนับ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* จำนวน */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนยอดคงเหลือ</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนขั้นต่ำ</label>
              <input
                type="number"
                min="0"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* หมายเหตุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            />
          </div>

          {/* ปุ่ม */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/material')}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
