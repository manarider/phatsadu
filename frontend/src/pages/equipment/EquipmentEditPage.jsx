import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const EQUIPMENT_STATUSES = ['ใช้งานได้', 'ชำรุด', 'อยู่ระหว่างซ่อม', 'รอตัดจำหน่าย']

export default function EquipmentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [imagePreview, setImagePreview] = useState(null)
  const [departments, setDepartments] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    serial_number: '',
    location: '',
    price: 0,
    custodian_name: '',
    acquired_date: '',
    description: '',
    project: '',
    note: '',
    department_name: '',
    status: 'ใช้งานได้',
    image: null,
  })

  useEffect(() => {
    fetchEquipment()
    if (user?.role === 'admin') {
      fetchDepartments()
    }
  }, [id, user])

  const fetchEquipment = async () => {
    try {
      const { data } = await api.get(`/equipment/${id}`)
      const item = data.data
      setFormData({
        name: item.name || '',
        serial_number: item.serial_number || '',
        location: item.location || '',
        price: item.price || 0,
        custodian_name: item.custodian_name || '',
        acquired_date: item.acquired_date ? item.acquired_date.split('T')[0] : '',
        description: item.description || '',
        project: item.project || '',
        note: item.note || '',
        department_name: item.department_name || '',
        status: item.status || 'ใช้งานได้',
        image: null,
      })
      if (item.image?.path) {
        setImagePreview(encodeURI(`${import.meta.env.BASE_URL}${item.image.path.replace(/^\//, '')}`))
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error)
      toast.error('ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้')
      navigate('/equipment')
    } finally {
      setFetching(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments')
      setDepartments(data.data || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB')
        return
      }
      setFormData({ ...formData, image: file })
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name || !formData.location || !formData.price || !formData.acquired_date) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
      return
    }

    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('serial_number', formData.serial_number)
      payload.append('location', formData.location)
      payload.append('price', formData.price)
      payload.append('custodian_name', formData.custodian_name)
      payload.append('acquired_date', formData.acquired_date)
      payload.append('description', formData.description)
      payload.append('project', formData.project)
      payload.append('note', formData.note)
      payload.append('status', formData.status)
      if (user?.role === 'admin') {
        payload.append('department_name', formData.department_name)
      }
      if (formData.image) {
        payload.append('image', formData.image)
      }

      await api.put(`/equipment/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('แก้ไขครุภัณฑ์สำเร็จ')
      navigate(`/equipment/${id}`)
    } catch (error) {
      console.error('Failed to update equipment:', error)
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <button
        type="button"
        onClick={() => navigate(`/equipment/${id}`)}
        className="text-blue-600 hover:underline text-sm"
      >
        ← กลับไปรายละเอียด
      </button>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">แก้ไขครุภัณฑ์</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ชื่อครุภัณฑ์ + ซีเรียล */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อครุภัณฑ์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ซีเรียล</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ที่ตั้ง + ผู้ดูแล */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ที่ตั้ง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ดูแล</label>
              <input
                type="text"
                value={formData.custodian_name}
                onChange={(e) => setFormData({ ...formData, custodian_name: e.target.value })}
                readOnly={user?.role !== 'admin' && user?.role !== 'staff'}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  user?.role !== 'admin' && user?.role !== 'staff' ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* ราคา + วันที่ได้มา */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ราคา (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่ได้มา <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.acquired_date}
                onChange={(e) => setFormData({ ...formData, acquired_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* หน่วยงาน + สถานะ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยงานเจ้าของครุภัณฑ์</label>
              {user?.role === 'admin' ? (
                <select
                  value={formData.department_name}
                  onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- เลือกหน่วยงาน --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.department_name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EQUIPMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* รายละเอียดครุภัณฑ์ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดครุภัณฑ์</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </div>

          {/* โครงการ + หมายเหตุ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">โครงการ</label>
              <input
                type="text"
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อโครงการ (ถ้ามี)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="หมายเหตุ"
              />
            </div>
          </div>

          {/* รูปภาพ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพ</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">อัปโหลดรูปใหม่เพื่อเปลี่ยนแปลง (ขนาดไม่เกิน 5 MB)</p>
            {imagePreview && (
              <div className="mt-2">
                <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover rounded border" />
              </div>
            )}
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
              onClick={() => navigate(`/equipment/${id}`)}
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
