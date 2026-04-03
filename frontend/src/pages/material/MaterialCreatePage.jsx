import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../lib/api'

export default function MaterialCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [materialTypes, setMaterialTypes] = useState([])

  // ── Mode: 'new' = สร้างใหม่, 'receive' = เพิ่มสต็อกวัสดุที่มีอยู่ ──
  const [mode, setMode] = useState('new')
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  // form สำหรับสร้างวัสดุใหม่
  const [formData, setFormData] = useState({
    name: '',
    material_type_id: '',
    unit: '',
    quantity: 0,
    min_quantity: 0,
    note: '',
  })

  // form สำหรับรับวัสดุเข้า
  const [receiveForm, setReceiveForm] = useState({
    add_quantity: 1,
    min_quantity: 0,
    reason: '',
    received_date: new Date().toISOString().slice(0, 10),
  })

  // ── Autocomplete state ──
  const [nameInput, setNameInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchMaterialTypes()
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchMaterialTypes = async () => {
    try {
      const { data } = await api.get('/materials/types')
      setMaterialTypes(data.data || [])
    } catch {
      toast.error('ไม่สามารถโหลดประเภทวัสดุได้')
    }
  }

  const searchMaterials = useCallback(async (q) => {
    if (!q.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    setSearching(true)
    try {
      const { data } = await api.get('/materials', { params: { q, limit: 10 } })
      setSuggestions(data.data || [])
      setShowSuggestions(true)
    } catch {
      setSuggestions([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleNameChange = (e) => {
    const val = e.target.value
    setNameInput(val)
    setFormData((prev) => ({ ...prev, name: val }))
    // ถ้าแก้ชื่อหลังเลือก → กลับ mode new
    if (mode === 'receive') {
      setMode('new')
      setSelectedMaterial(null)
    }
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchMaterials(val), 300)
  }

  const selectSuggestion = (item) => {
    setNameInput(item.name)
    setSelectedMaterial(item)
    setMode('receive')
    setReceiveForm({
      add_quantity: 1,
      min_quantity: item.min_quantity ?? 0,
      reason: '',
      received_date: new Date().toISOString().slice(0, 10),
    })
    setSuggestions([])
    setShowSuggestions(false)
  }

  const clearSelection = () => {
    setNameInput('')
    setFormData((prev) => ({ ...prev, name: '' }))
    setMode('new')
    setSelectedMaterial(null)
    setSuggestions([])
  }

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (mode === 'receive') {
      // รับวัสดุเข้าสต็อก
      if (receiveForm.add_quantity <= 0) {
        toast.error('จำนวนที่เพิ่มต้องมากกว่า 0')
        return
      }
      setLoading(true)
      try {
        // อัปเดต min_quantity ถ้าเปลี่ยน
        if (receiveForm.min_quantity !== selectedMaterial.min_quantity) {
          await api.put(`/materials/${selectedMaterial._id}`, {
            min_quantity: receiveForm.min_quantity,
          })
        }
        // สร้าง transaction รับวัสดุ
        await api.post(`/materials/${selectedMaterial._id}/transactions`, {
          type: 'receive',
          quantity: receiveForm.add_quantity,
          reason: receiveForm.reason || `รับวัสดุเข้าสต็อก ${receiveForm.received_date}`,
        })
        toast.success(`รับ "${selectedMaterial.name}" เข้าสต็อก ${receiveForm.add_quantity} ${selectedMaterial.unit} สำเร็จ`)
        navigate('/material')
      } catch (error) {
        toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด')
      } finally {
        setLoading(false)
      }
    } else {
      // สร้างวัสดุใหม่
      if (!formData.name || !formData.material_type_id || !formData.unit) {
        toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
        return
      }
      setLoading(true)
      try {
        await api.post('/materials', formData)
        toast.success('เพิ่มวัสดุสำเร็จ')
        navigate('/material')
      } catch (error) {
        toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด')
      } finally {
        setLoading(false)
      }
    }
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
        <h1 className="text-2xl font-bold text-gray-800 mb-1">เพิ่มวัสดุ</h1>
        <p className="text-sm text-gray-500 mb-6">ค้นหาชื่อวัสดุที่มีอยู่เพื่อรับเข้าสต็อก หรือกรอกชื่อใหม่เพื่อเพิ่มรายการใหม่</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── ชื่อวัสดุ — autocomplete ── */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อวัสดุ <span className="text-red-500">*</span>
            </label>
            <div className="relative flex gap-2 items-center">
              <input
                type="text"
                value={nameInput}
                onChange={handleNameChange}
                onFocus={() => nameInput && setShowSuggestions(suggestions.length > 0)}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 ${
                  mode === 'receive' ? 'border-green-400 bg-green-50' : 'border-gray-300'
                }`}
                placeholder="พิมพ์ชื่อวัสดุเพื่อค้นหา หรือกรอกชื่อใหม่"
                autoComplete="off"
                required
              />
              {searching && (
                <span className="absolute right-10 top-2.5 text-gray-400 text-xs animate-pulse">⟳</span>
              )}
              {mode === 'receive' && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="flex-shrink-0 text-xs text-gray-500 hover:text-red-600 border border-gray-300 rounded px-2 py-2"
                  title="ล้างและเพิ่มใหม่"
                >
                  ✕ ล้าง
                </button>
              )}
            </div>

            {showSuggestions && (
              <ul className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                {suggestions.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-500 italic">
                    ไม่พบวัสดุชื่อนี้ — จะเพิ่มเป็นรายการใหม่
                  </li>
                ) : (
                  <>
                    {suggestions.map((item) => (
                      <li
                        key={item._id}
                        onMouseDown={() => selectSuggestion(item)}
                        className="cursor-pointer px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="ml-2 text-xs text-gray-500">{item.material_type_name}</span>
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          คงเหลือ <strong>{item.quantity}</strong> {item.unit}
                        </span>
                      </li>
                    ))}
                    <li className="border-t px-4 py-2 text-xs text-gray-400 italic">
                      ไม่มีในรายการ? กรอกชื่อใหม่แล้วบันทึกได้เลย
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>

          {/* ── Mode: รับวัสดุเข้าสต็อก (เลือกจาก suggestion) ── */}
          {mode === 'receive' && selectedMaterial && (
            <>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <span className="font-medium">📦 รับวัสดุเข้าสต็อก:</span> {selectedMaterial.name}
                &nbsp;·&nbsp;ประเภท: {selectedMaterial.material_type_name}
                &nbsp;·&nbsp;หน่วย: {selectedMaterial.unit}
              </div>

              {/* ยอดคงเหลือเดิม — readonly */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยอดคงเหลือเดิม</label>
                <input
                  type="number"
                  value={selectedMaterial.quantity}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* จำนวนที่เพิ่ม + วันที่ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนที่เพิ่ม <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={receiveForm.add_quantity}
                    onChange={(e) => setReceiveForm((p) => ({ ...p, add_quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ยอดหลังเพิ่ม: <strong>{selectedMaterial.quantity + receiveForm.add_quantity}</strong> {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่รับเข้า</label>
                  <input
                    type="date"
                    value={receiveForm.received_date}
                    onChange={(e) => setReceiveForm((p) => ({ ...p, received_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* จำนวนขั้นต่ำ — แก้ไขได้ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนขั้นต่ำ</label>
                <input
                  type="number"
                  min="0"
                  value={receiveForm.min_quantity}
                  onChange={(e) => setReceiveForm((p) => ({ ...p, min_quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* หมายเหตุ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ / แหล่งที่มา</label>
                <input
                  type="text"
                  value={receiveForm.reason}
                  onChange={(e) => setReceiveForm((p) => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น งบประมาณ 2568, บริจาค, ซื้อเพิ่ม"
                />
              </div>
            </>
          )}

          {/* ── Mode: สร้างวัสดุใหม่ ── */}
          {mode === 'new' && (
            <>
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
                <option key={type._id} value={type._id}>
                  {type.name}
                </option>
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
              placeholder="เช่น รีม, ชิ้น, กล่อง"
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
            </>
          )}

          {/* ปุ่ม */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading
                ? 'กำลังบันทึก...'
                : mode === 'receive'
                  ? `📦 รับเข้าสต็อก +${receiveForm.add_quantity}`
                  : 'บันทึก'}
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
