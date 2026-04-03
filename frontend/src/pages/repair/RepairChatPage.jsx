import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB
const MAX_FILES = 2
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

function newRow() {
  return { description: '', quantity: 1, price: 0 }
}

export default function RepairChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [repair, setRepair] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [savingResult, setSavingResult] = useState(false)
  const [editingResult, setEditingResult] = useState(false)
  const [rejectDialog, setRejectDialog] = useState(false)
  const [rejectionStatus, setRejectionStatus] = useState('ชำรุด')

  // Repair result form state
  const [repairer, setRepairer] = useState('')
  const [repairItems, setRepairItems] = useState([newRow()])
  const [repairNote, setRepairNote] = useState('')
  const [repairFiles, setRepairFiles] = useState([])
  const fileInputRef = useRef(null)

  // Attachment viewer modal
  const [attachViewer, setAttachViewer] = useState(false)

  useEffect(() => {
    fetchRepair()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [id])

  const fetchRepair = async () => {
    try {
      const { data } = await api.get(`/repairs/${id}`)
      setRepair(data.data)
      fetchMessages()
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลแจ้งซ่อมได้')
      navigate('/repair')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/chat/${id}/messages`)
      setMessages(data.data || [])
    } catch (error) {
      console.error('ไม่สามารถโหลดข้อความได้')
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMsg.trim()) return
    try {
      setPolling(true)
      await api.post(`/chat/${id}/messages`, { message: newMsg })
      setNewMsg('')
      await fetchMessages()
      toast.success('ส่งข้อความสำเร็จ')
    } catch (error) {
      toast.error('ไม่สามารถส่งข้อความได้')
    } finally {
      setPolling(false)
    }
  }

  const handleStatusChange = async (newStatus, rejectionEquipmentStatus) => {
    if (!newStatus || newStatus === repair?.status) return
    const labelMap = {
      pending: 'รอดำเนินการ', approved: 'อนุมัติ (เริ่มซ่อม)',
      in_progress: 'กำลังซ่อม', completed: 'เสร็จสิ้น', rejected: 'ไม่อนุมัติ',
    }
    if (!window.confirm(`ต้องการเปลี่ยนสถานะเป็น "${labelMap[newStatus] || newStatus}" ใช่หรือไม่?`)) return
    try {
      await api.patch(`/repairs/${id}/status`, {
        status: newStatus,
        ...(newStatus === 'rejected' && { rejection_equipment_status: rejectionEquipmentStatus || 'ชำรุด' }),
      })
      toast.success('เปลี่ยนสถานะสำเร็จ')
      await fetchRepair()
    } catch (error) {
      toast.error(error.response?.data?.error || 'ไม่สามารถเปลี่ยนสถานะได้')
    }
  }

  const getStatusLabel = (status) => ({
    pending: 'รอดำเนินการ', approved: 'อนุมัติแล้ว',
    in_progress: 'กำลังซ่อม', completed: 'เสร็จสิ้น', rejected: 'ไม่อนุมัติ',
  }[status] || status)

  const getStatusColor = (status) => ({
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }[status] || 'bg-gray-100 text-gray-800')

  const canEditResult = user?.role === 'admin' || user?.role === 'staff'

  // ─── Repair items helpers ───────────────────────
  const updateRow = (idx, field, value) => {
    setRepairItems((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }
  const addRow = () => setRepairItems((prev) => [...prev, newRow()])
  const removeRow = (idx) => setRepairItems((prev) => prev.filter((_, i) => i !== idx))
  const totalPrice = repairItems.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.price) || 0), 0)

  // ─── File validation ────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const valid = []
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`ไฟล์ "${file.name}" ประเภทไม่รองรับ`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`ไฟล์ "${file.name}" ขนาดเกิน 4MB`)
        continue
      }
      valid.push(file)
    }
    const combined = [...repairFiles, ...valid].slice(0, MAX_FILES)
    setRepairFiles(combined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const removeFile = (idx) => setRepairFiles((prev) => prev.filter((_, i) => i !== idx))

  // ─── Open edit form ─────────────────────────────
  const openEditForm = () => {
    setRepairer(repair?.repairer || '')
    setRepairItems(repair?.repair_items?.length > 0
      ? repair.repair_items.map((r) => ({ description: r.description, quantity: r.quantity, price: r.price }))
      : [newRow()]
    )
    setRepairNote(repair?.repair_note || '')
    setRepairFiles([])
    setEditingResult(true)
  }

  // ─── Save result ────────────────────────────────
  const handleSaveResult = async (e) => {
    e.preventDefault()
    try {
      setSavingResult(true)
      const fd = new FormData()
      fd.append('repairer', repairer)
      fd.append('repair_items', JSON.stringify(
        repairItems.filter((r) => r.description.trim())
      ))
      fd.append('repair_note', repairNote)
      for (const file of repairFiles) {
        fd.append('files', file)
      }
      await api.patch(`/repairs/${id}/result`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('บันทึกผลการซ่อมสำเร็จ')
      setEditingResult(false)
      await fetchRepair()
    } catch (error) {
      toast.error(error.response?.data?.error || 'ไม่สามารถบันทึกผลการซ่อมได้')
    } finally {
      setSavingResult(false)
    }
  }

  const hasResult = repair?.repairer || repair?.repair_items?.length > 0 || repair?.repair_note

  const backendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || ''

  if (loading) {
    return <div className="text-center text-gray-600">กำลังโหลด...</div>
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => navigate('/repair')} className="text-blue-600 hover:underline">
          ← กลับไปรายการ
        </button>
        <button
          type="button"
          onClick={() => window.open(`/phatsadu/repair/${id}/print`, '_blank')}
          className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
        >
          🖨️ พิมพ์ใบงานซ่อม
        </button>
      </div>

      {/* ─── ข้อมูลหัว ─────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {repair?.is_bulk ? (
          <>
            <h2 className="font-semibold text-gray-900">
              แจ้งซ่อมหลายรายการ ({repair.equipment_items?.length || 0} รายการ)
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="pb-2 pr-4">รหัสครุภัณฑ์</th>
                    <th className="pb-2 pr-4">ชื่อ</th>
                    <th className="pb-2 pr-4">ประเภท</th>
                    <th className="pb-2">หน่วยงาน</th>
                  </tr>
                </thead>
                <tbody>
                  {repair.equipment_items?.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-1.5 pr-4 font-mono text-xs">{item.asset_code || '-'}</td>
                      <td className="py-1.5 pr-4">{item.name || '-'}</td>
                      <td className="py-1.5 pr-4 text-gray-600">{item.equipment_type_name || '-'}</td>
                      <td className="py-1.5 text-gray-600">{item.department_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-gray-900">{repair?.equipment_name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              รหัสครุภัณฑ์: {repair?.equipment_asset_code || '-'}
              {repair?.department_name && <span className="ml-3">หน่วยงาน: {repair.department_name}</span>}
            </p>
          </>
        )}
        <p className="text-sm text-gray-600 mt-2">{repair?.problem_detail}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">สถานะ:</span>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(repair?.status)}`}>
            {getStatusLabel(repair?.status)}
          </span>
          {repair?.status !== 'completed' && repair?.status !== 'rejected' && (
            <select
              value=""
              onChange={(e) => {
                const v = e.target.value
                if (!v) return
                if (v === 'rejected') setRejectDialog(true)
                else handleStatusChange(v)
              }}
              className="ml-2 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เปลี่ยนสถานะ --</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="approved">อนุมัติ (เริ่มซ่อม)</option>
              <option value="in_progress">กำลังซ่อม</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
          )}
        </div>
        {repair?.approved_by && <p className="mt-2 text-xs text-gray-500">อนุมัติโดย: {repair.approved_by}</p>}
        {repair?.completed_at && (
          <p className="text-xs text-gray-500">
            เสร็จสิ้นเมื่อ: {new Date(repair.completed_at).toLocaleString('th-TH')}
          </p>
        )}
      </div>

      {/* ─── Modal ปฏิเสธ ─────────────────────── */}
      {rejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-3 font-semibold text-gray-900">ไม่อนุมัติการซ่อม</h3>
            <p className="mb-3 text-sm text-gray-600">เลือกสถานะครุภัณฑ์หลังจากไม่อนุมัติ:</p>
            <div className="space-y-2 mb-4">
              {['ชำรุด', 'รอตัดจำหน่าย'].map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rejStatus" value={v} checked={rejectionStatus === v}
                    onChange={(e) => setRejectionStatus(e.target.value)} />
                  <span className="text-sm">{v === 'ชำรุด' ? 'ชำรุด (รอการซ่อมในอนาคต)' : 'รอตัดจำหน่าย'}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button"
                onClick={async () => { setRejectDialog(false); await handleStatusChange('rejected', rejectionStatus) }}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700">
                ยืนยันไม่อนุมัติ
              </button>
              <button type="button" onClick={() => setRejectDialog(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Attachment viewer modal ────────────── */}
      {attachViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">ไฟล์แนบการซ่อม</h3>
              <button type="button" onClick={() => setAttachViewer(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">×</button>
            </div>
            <div className="space-y-3">
              {repair?.repair_attachments?.map((att, idx) => {
                const isImage = att.mime_type?.startsWith('image/')
                const url = `${backendBase}${att.path}`
                return (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3">
                    {isImage ? (
                      <img src={url} alt={att.filename} className="max-h-64 w-full rounded object-contain" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{att.filename}</p>
                          <p className="text-xs text-gray-500">{(att.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    )}
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-blue-600 hover:underline">
                      เปิดไฟล์ →
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── ผลการซ่อม ─────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">ผลการซ่อม</h3>
          <div className="flex gap-2">
            {repair?.repair_attachments?.length > 0 && !editingResult && (
              <button type="button" onClick={() => setAttachViewer(true)}
                className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200">
                📎 ดูไฟล์แนบ ({repair.repair_attachments.length})
              </button>
            )}
            {canEditResult && !editingResult && (
              <button type="button" onClick={openEditForm}
                className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700">
                {hasResult ? '✏️ แก้ไข' : '+ บันทึกผล'}
              </button>
            )}
          </div>
        </div>

        {/* ─── View mode ─── */}
        {!editingResult && hasResult && (
          <div className="mt-3 space-y-3">
            {repair.repairer && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">ผู้ซ่อม / ร้านซ่อม</span>
                <p className="text-sm text-gray-800 mt-0.5">{repair.repairer}</p>
              </div>
            )}
            {repair.repair_items?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">รายการซ่อม</span>
                <div className="mt-1 overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">รายการซ่อม</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 w-20">จำนวน</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 w-28">ราคา (บาท)</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 w-28">รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repair.repair_items.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-800">{item.description}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {(item.quantity * item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-700">รวมทั้งสิ้น</td>
                        <td className="px-3 py-2 text-right font-bold text-indigo-700">
                          {Number(repair.repair_total_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
            {repair.repair_note && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">หมายเหตุ</span>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700">{repair.repair_note}</p>
              </div>
            )}
          </div>
        )}

        {!editingResult && !hasResult && (
          <p className="mt-2 text-sm text-gray-400 italic">ยังไม่มีผลการซ่อม</p>
        )}

        {/* ─── Edit / Create form ─── */}
        {editingResult && (
          <form onSubmit={handleSaveResult} className="mt-4 space-y-4">
            {/* ผู้ซ่อม */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ผู้ซ่อม / ร้านซ่อม
              </label>
              <input type="text" value={repairer} onChange={(e) => setRepairer(e.target.value)}
                placeholder="เช่น นายสมชาย ใจดี หรือ ร้านซ่อมอิเล็กทรอนิกส์ ABC"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* รายการซ่อม */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รายการซ่อม</label>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">รายการซ่อม</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 w-24">จำนวน</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 w-32">ราคา (บาท)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairItems.map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-2 py-1.5">
                          <input type="text" value={row.description}
                            onChange={(e) => updateRow(idx, 'description', e.target.value)}
                            placeholder="ระบุรายการ"
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" value={row.quantity}
                            onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="0.01" value={row.price}
                            onChange={(e) => updateRow(idx, 'price', e.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {repairItems.length > 1 && (
                            <button type="button" onClick={() => removeRow(idx)}
                              className="text-red-400 hover:text-red-600 text-lg leading-none font-bold">×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-3 py-2">
                        <button type="button" onClick={addRow}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                          + เพิ่มบรรทัด
                        </button>
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td colSpan={2} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">รวมทั้งสิ้น</td>
                      <td colSpan={2} className="px-3 py-2 text-right font-bold text-indigo-700">
                        {totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Upload ไฟล์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ไฟล์แนบ (ไม่เกิน {MAX_FILES} ไฟล์ ขนาดไม่เกิน 4MB ต่อไฟล์)
              </label>
              <p className="text-xs text-gray-500 mb-2">รองรับ: รูปภาพ, PDF, Word, Excel</p>
              {repairFiles.length < MAX_FILES && (
                <div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange} className="hidden" id="repair-file-input" />
                  <label htmlFor="repair-file-input"
                    className="inline-block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    📎 เลือกไฟล์
                  </label>
                </div>
              )}
              {repairFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {repairFiles.map((f, idx) => (
                    <li key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                      <span className="truncate text-gray-700">{f.name} <span className="text-xs text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span></span>
                      <button type="button" onClick={() => removeFile(idx)}
                        className="ml-2 text-red-400 hover:text-red-600 font-bold text-base leading-none">×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* หมายเหตุ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
              <textarea rows={3} value={repairNote} onChange={(e) => setRepairNote(e.target.value)}
                placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={savingResult}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {savingResult ? 'กำลังบันทึก...' : 'บันทึกผลการซ่อม'}
              </button>
              <button type="button" onClick={() => setEditingResult(false)}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
            </div>
            <p className="text-xs text-gray-500">* การบันทึกผลจะเปลี่ยนสถานะเป็น "เสร็จสิ้น" โดยอัตโนมัติ</p>
          </form>
        )}
      </div>

      {/* ─── แชท ───────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 font-semibold text-gray-900">แชท</h3>
        <div className="mb-4 max-h-96 space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-3">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-600">ยังไม่มีข้อความ</p>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="rounded-lg bg-white p-2 text-sm">
                <p className="font-medium text-gray-900">{msg.sender_name}</p>
                <p className="text-gray-700">{msg.message}</p>
                <p className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString('th-TH')}</p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input type="text" placeholder="พิมพ์ข้อความ..." value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)} disabled={polling}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-50" />
          <button type="submit" disabled={polling || !newMsg.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            ส่ง
          </button>
        </form>
      </div>
    </div>
  )
}

