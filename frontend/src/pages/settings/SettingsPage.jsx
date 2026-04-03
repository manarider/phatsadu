import { useEffect, useState, useCallback } from 'react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// ─── Reusable CRUD Section ────────────────────────────────────────────────────
function CrudSection({ title, items, loading, onAdd, onEdit, onDelete, renderRow, addForm }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          + เพิ่ม
        </button>
      </div>
      {addForm}
      {loading ? (
        <div className="p-6 text-center text-gray-500 text-sm">กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div className="p-6 text-center text-gray-500 text-sm">ยังไม่มีข้อมูล</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => renderRow(item))}
        </ul>
      )}
    </div>
  )
}

// ─── Department Tab ───────────────────────────────────────────────────────────
function DepartmentTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/departments')
      setItems(data.data || [])
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleAdd = async () => {
    if (!addName.trim()) return
    setSaving(true)
    try {
      await api.post('/departments', { name: addName.trim() })
      toast.success('เพิ่มหน่วยงานสำเร็จ')
      setAddName('')
      setShowAdd(false)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id) => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await api.put(`/departments/${id}`, { name: editName.trim() })
      toast.success('แก้ไขสำเร็จ')
      setEditId(null)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`ยืนยันลบหน่วยงาน "${item.name}" ?`)) return
    try {
      await api.delete(`/departments/${item._id}`)
      toast.success('ลบสำเร็จ')
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  const addForm = showAdd ? (
    <div className="px-5 py-3 bg-blue-50 border-b border-gray-100 flex items-center gap-2">
      <input
        autoFocus
        value={addName}
        onChange={(e) => setAddName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="ชื่อหน่วยงาน"
        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">บันทึก</button>
      <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300">ยกเลิก</button>
    </div>
  ) : null

  const renderRow = (item) => (
    <li key={item._id} className="flex items-center justify-between px-5 py-3">
      {editId === item._id ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEdit(item._id)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button onClick={() => handleEdit(item._id)} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50">บันทึก</button>
          <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-md hover:bg-gray-300">ยกเลิก</button>
        </div>
      ) : (
        <>
          <span className="text-sm text-gray-800">{item.name}</span>
          <div className="flex gap-2">
            <button onClick={() => { setEditId(item._id); setEditName(item.name) }} className="text-xs text-blue-600 hover:underline">แก้ไข</button>
            <button onClick={() => handleDelete(item)} className="text-xs text-red-500 hover:underline">ลบ</button>
          </div>
        </>
      )}
    </li>
  )

  return (
    <CrudSection
      title="จัดการหน่วยงาน"
      items={items}
      loading={loading}
      onAdd={() => { setShowAdd(true); setEditId(null) }}
      addForm={addForm}
      renderRow={renderRow}
    />
  )
}

// ─── EquipmentType Tab ────────────────────────────────────────────────────────
function EquipmentTypeTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addCode, setAddCode] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/equipment/types')
      setItems(data.data || [])
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleAdd = async () => {
    if (!addName.trim() || !addCode.trim()) { toast.error('กรุณากรอกชื่อและรหัส'); return }
    setSaving(true)
    try {
      await api.post('/equipment/types', { name: addName.trim(), code: addCode.trim() })
      toast.success('เพิ่มประเภทครุภัณฑ์สำเร็จ')
      setAddName(''); setAddCode(''); setShowAdd(false)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id) => {
    if (!editName.trim() || !editCode.trim()) { toast.error('กรุณากรอกชื่อและรหัส'); return }
    setSaving(true)
    try {
      await api.put(`/equipment/types/${id}`, { name: editName.trim(), code: editCode.trim() })
      toast.success('แก้ไขสำเร็จ')
      setEditId(null)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`ยืนยันลบประเภท "${item.name}" ?`)) return
    try {
      await api.delete(`/equipment/types/${item._id}`)
      toast.success('ลบสำเร็จ')
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  const addForm = showAdd ? (
    <div className="px-5 py-3 bg-blue-50 border-b border-gray-100 flex items-center gap-2 flex-wrap">
      <input autoFocus value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="ชื่อประเภท" className="flex-1 min-w-32 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      <input value={addCode} onChange={(e) => setAddCode(e.target.value.toUpperCase())} placeholder="รหัส (เช่น COM)" className="w-28 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">บันทึก</button>
      <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300">ยกเลิก</button>
    </div>
  ) : null

  const renderRow = (item) => (
    <li key={item._id} className="flex items-center justify-between px-5 py-3">
      {editId === item._id ? (
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 min-w-32 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input value={editCode} onChange={(e) => setEditCode(e.target.value.toUpperCase())} className="w-28 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={() => handleEdit(item._id)} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50">บันทึก</button>
          <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-md hover:bg-gray-300">ยกเลิก</button>
        </div>
      ) : (
        <>
          <div>
            <span className="text-sm text-gray-800">{item.name}</span>
            <span className="ml-2 text-xs text-gray-400 font-mono">{item.code}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditId(item._id); setEditName(item.name); setEditCode(item.code) }} className="text-xs text-blue-600 hover:underline">แก้ไข</button>
            <button onClick={() => handleDelete(item)} className="text-xs text-red-500 hover:underline">ลบ</button>
          </div>
        </>
      )}
    </li>
  )

  return (
    <CrudSection
      title="จัดการประเภทครุภัณฑ์"
      items={items}
      loading={loading}
      onAdd={() => { setShowAdd(true); setEditId(null) }}
      addForm={addForm}
      renderRow={renderRow}
    />
  )
}

// ─── MaterialType Tab ─────────────────────────────────────────────────────────
function MaterialTypeTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/materials/types')
      setItems(data.data || [])
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleAdd = async () => {
    if (!addName.trim()) return
    setSaving(true)
    try {
      await api.post('/materials/types', { name: addName.trim() })
      toast.success('เพิ่มประเภทวัสดุสำเร็จ')
      setAddName(''); setShowAdd(false)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id) => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await api.put(`/materials/types/${id}`, { name: editName.trim() })
      toast.success('แก้ไขสำเร็จ')
      setEditId(null)
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`ยืนยันลบประเภทวัสดุ "${item.name}" ?`)) return
    try {
      await api.delete(`/materials/types/${item._id}`)
      toast.success('ลบสำเร็จ')
      fetch()
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  const addForm = showAdd ? (
    <div className="px-5 py-3 bg-blue-50 border-b border-gray-100 flex items-center gap-2">
      <input autoFocus value={addName} onChange={(e) => setAddName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="ชื่อประเภทวัสดุ" className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
      <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">บันทึก</button>
      <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300">ยกเลิก</button>
    </div>
  ) : null

  const renderRow = (item) => (
    <li key={item._id} className="flex items-center justify-between px-5 py-3">
      {editId === item._id ? (
        <div className="flex items-center gap-2 flex-1">
          <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEdit(item._id)} className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={() => handleEdit(item._id)} disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50">บันทึก</button>
          <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-md hover:bg-gray-300">ยกเลิก</button>
        </div>
      ) : (
        <>
          <span className="text-sm text-gray-800">{item.name}</span>
          <div className="flex gap-2">
            <button onClick={() => { setEditId(item._id); setEditName(item.name) }} className="text-xs text-blue-600 hover:underline">แก้ไข</button>
            <button onClick={() => handleDelete(item)} className="text-xs text-red-500 hover:underline">ลบ</button>
          </div>
        </>
      )}
    </li>
  )

  return (
    <CrudSection
      title="จัดการประเภทวัสดุ"
      items={items}
      loading={loading}
      onAdd={() => { setShowAdd(true); setEditId(null) }}
      addForm={addForm}
      renderRow={renderRow}
    />
  )
}

// ─── System Settings Tab ──────────────────────────────────────────────────────
function SystemSettingsTab() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [editValues, setEditValues] = useState({})

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings')
      setSettings(data.data || {})
      setEditValues(data.data || {})
    } catch {
      toast.error('ไม่สามารถโหลดการตั้งค่าได้')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key) => {
    try {
      await api.put(`/settings/${key}`, { value: editValues[key] })
      toast.success('บันทึกการตั้งค่าสำเร็จ')
      await fetchSettings()
    } catch {
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้')
    }
  }

  const handleToggle = async (key, currentValue) => {
    const newValue = !currentValue
    setEditValues({ ...editValues, [key]: newValue })
    try {
      await api.put(`/settings/${key}`, { value: newValue })
      toast.success('บันทึกการตั้งค่าสำเร็จ')
      await fetchSettings()
    } catch {
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้')
      setEditValues({ ...editValues, [key]: currentValue })
    }
  }

  const labels = {
    min_stock_alert_threshold: 'เกณฑ์แจ้งเตือนสต็อกต่ำ',
    approval_required_for_repair: 'ต้องอนุมัติก่อนซ่อม',
    auto_approve_material_withdraw: 'อนุมัติการเบิกวัสดุอัตโนมัติ',
    system_maintenance_mode: 'โหมดปิดปรุงระบบ',
    max_file_upload_size_mb: 'ขนาดไฟล์อัพโหลดสูงสุด (MB)',
  }
  const descriptions = {
    min_stock_alert_threshold: 'จำนวนสต็อกขั้นต่ำที่จะแจ้งเตือน',
    approval_required_for_repair: 'การแจ้งซ่อมต้องผ่านการอนุมัติก่อนดำเนินการ',
    auto_approve_material_withdraw: 'การเบิกวัสดุจะได้รับการอนุมัติทันที',
    system_maintenance_mode: 'ระบบจะไม่สามารถใช้งานได้ชั่วคราว',
    max_file_upload_size_mb: 'ขนาดไฟล์สูงสุดที่อนุญาตให้อัพโหลด',
  }

  if (loading) return <div className="p-8 text-center text-gray-500 text-sm">กำลังโหลด...</div>

  return (
    <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-200">
      {Object.keys(settings).length === 0 ? (
        <div className="p-8 text-center text-gray-600">ไม่พบการตั้งค่า</div>
      ) : (
        Object.entries(settings).map(([key, value]) => (
          <div key={key} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{labels[key] || key}</h3>
                <p className="text-sm text-gray-600 mt-1">{descriptions[key] || ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {typeof value === 'boolean' ? (
                  <button
                    type="button"
                    onClick={() => handleToggle(key, value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type={typeof value === 'number' ? 'number' : 'text'}
                      value={editValues[key] ?? value}
                      onChange={(e) => setEditValues({ ...editValues, [key]: typeof value === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(key)}
                      disabled={editValues[key] === value}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      บันทึก
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'system', label: 'ตั้งค่าระบบ' },
  { id: 'department', label: 'หน่วยงาน' },
  { id: 'equipment_type', label: 'ประเภทครุภัณฑ์' },
  { id: 'material_type', label: 'ประเภทวัสดุ' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('system')

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ</h1>

      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'system' && <SystemSettingsTab />}
      {tab === 'department' && <DepartmentTab />}
      {tab === 'equipment_type' && <EquipmentTypeTab />}
      {tab === 'material_type' && <MaterialTypeTab />}
    </div>
  )
}
