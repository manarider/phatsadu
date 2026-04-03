import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

function thaiDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function SalePreparePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState({})       // idx → value string
  const [uploading, setUploading] = useState(null) // idx
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [completeForm, setCompleteForm] = useState({
    sale_date: new Date().toISOString().slice(0, 10),
    total_price: '',
    document_number: '',
    details: '',
  })
  const [docFile, setDocFile] = useState(null)
  const fileRefs = useRef({})
  const docFileRef = useRef(null)

  const canWrite = ['admin', 'manager', 'staff'].includes(user?.role)

  useEffect(() => { fetchDraft() }, [id])

  const fetchDraft = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/sale/draft/${id}`)
      setDraft(data.data)
      const p = {}
      data.data.items.forEach((it, i) => { p[i] = String(it.estimated_price || '') })
      setPrices(p)
    } catch {
      toast.error('ไม่พบรายการเตรียมจำหน่าย')
      navigate('/sale')
    } finally {
      setLoading(false)
    }
  }

  const handlePriceBlur = async (idx) => {
    const val = Number(prices[idx]) || 0
    if (val === (draft.items[idx]?.estimated_price || 0)) return
    try {
      await api.patch(`/sale/draft/${id}/items/${idx}/price`, { estimated_price: val })
      setDraft((prev) => {
        const items = [...prev.items]
        items[idx] = { ...items[idx], estimated_price: val }
        return { ...prev, items }
      })
    } catch {
      toast.error('บันทึกราคาไม่สำเร็จ')
    }
  }

  const handleImageUpload = async (idx, file) => {
    if (!file) return
    setUploading(idx)
    try {
      const form = new FormData()
      form.append('image', file)
      const { data } = await api.post(`/sale/draft/${id}/items/${idx}/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setDraft((prev) => {
        const items = [...prev.items]
        items[idx] = { ...items[idx], image: data.data.image }
        return { ...prev, items }
      })
      toast.success('อัปโหลดรูปสำเร็จ')
    } catch (err) {
      toast.error(err.response?.data?.error || 'อัปโหลดรูปไม่สำเร็จ')
    } finally {
      setUploading(null)
    }
  }

  const totalEstimated = draft?.items.reduce((s, it) => s + (it.estimated_price || 0), 0) || 0

  const handleComplete = async () => {
    if (!completeForm.sale_date || !completeForm.document_number) {
      return toast.error('กรุณาระบุวันที่จำหน่ายและเลขที่เอกสาร')
    }
    setCompleting(true)
    try {
      const form = new FormData()
      form.append('sale_date', completeForm.sale_date)
      form.append('total_price', completeForm.total_price || totalEstimated)
      form.append('document_number', completeForm.document_number)
      form.append('details', completeForm.details)
      if (docFile) form.append('doc_file', docFile)

      await api.post(`/sale/draft/${id}/complete`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('จำหน่ายครุภัณฑ์สำเร็จ')
      navigate('/sale/history')
    } catch (err) {
      toast.error(err.response?.data?.error || 'จำหน่ายไม่สำเร็จ')
    } finally {
      setCompleting(false)
      setShowCompleteModal(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('ลบรายการเตรียมจำหน่ายนี้?')) return
    try {
      await api.delete(`/sale/draft/${id}`)
      toast.success('ลบรายการแล้ว')
      navigate('/sale')
    } catch {
      toast.error('ลบไม่สำเร็จ')
    }
  }

  const handlePrint = () => {
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    const rows = (draft?.items || []).map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-family:monospace">${it.asset_code}</td>
        <td>${it.name}</td>
        <td>${it.equipment_type_name}</td>
        <td>${it.department_name}</td>
        <td>${it.serial_number || '-'}</td>
        <td style="text-align:right">${(it.original_price || 0).toLocaleString()}</td>
        <td style="text-align:right">${(it.estimated_price || 0).toLocaleString()}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"/>
<title>รายการเตรียมจำหน่าย</title>
<style>
* { margin:0;padding:0;box-sizing:border-box }
body { font-family:'Sarabun','TH Sarabun New',sans-serif; font-size:13px; padding:20px }
h2 { font-size:18px; margin-bottom:4px }
.sub { font-size:12px; color:#555; margin-bottom:12px }
table { width:100%; border-collapse:collapse }
th { background:#f3f4f6; padding:6px 8px; border:1px solid #d1d5db; text-align:left; font-weight:600 }
td { padding:5px 8px; border:1px solid #d1d5db; vertical-align:top }
tr:nth-child(even) td { background:#f9fafb }
.total { text-align:right; margin-top:8px; font-weight:bold }
</style></head>
<body>
<h2>รายการเตรียมจำหน่ายครุภัณฑ์</h2>
<p class="sub">วันที่พิมพ์: ${dateStr} | ปีงบประมาณ: ${draft?.fiscal_year || ''} | รวม ${draft?.items?.length || 0} รายการ</p>
<table>
  <thead><tr><th>#</th><th>รหัส</th><th>ชื่อครุภัณฑ์</th><th>ประเภท</th><th>หน่วยงาน</th><th>ซีเรียล</th><th style="text-align:right">ราคาทะเบียน</th><th style="text-align:right">ราคาประเมิน</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<p class="total">ราคาประเมินรวม: ${totalEstimated.toLocaleString()} บาท</p>
</body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  if (loading) return <div className="text-center py-10 text-gray-500">กำลังโหลด...</div>
  if (!draft) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เตรียมจำหน่ายครุภัณฑ์</h1>
          <p className="text-sm text-gray-500">ปีงบประมาณ {draft.fiscal_year} · {draft.items.length} รายการ</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => navigate('/sale')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">← กลับ</button>
          <button type="button" onClick={handlePrint} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">🖨️ พิมพ์ / PDF</button>
          {canWrite && (
            <>
              <button type="button" onClick={handleDelete} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">🗑️ ลบรายการนี้</button>
              <button type="button" onClick={() => setShowCompleteModal(true)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">✅ จำหน่าย</button>
            </>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">#</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">รหัสครุภัณฑ์</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">ชื่อ</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">ประเภท</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">ราคาทะเบียน</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">ราคาประเมิน (บาท)</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">รูปภาพ</th>
            </tr>
          </thead>
          <tbody>
            {draft.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                <td className="px-3 py-2 font-mono whitespace-nowrap">{item.asset_code}</td>
                <td className="px-3 py-2 break-words min-w-[160px]">{item.name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{item.equipment_type_name}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{(item.original_price || 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  {canWrite ? (
                    <input
                      type="number"
                      min="0"
                      className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                      value={prices[idx] ?? ''}
                      onChange={(e) => setPrices((p) => ({ ...p, [idx]: e.target.value }))}
                      onBlur={() => handlePriceBlur(idx)}
                    />
                  ) : (
                    <span>{(item.estimated_price || 0).toLocaleString()}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {item.image?.path ? (
                    <a href={item.image.path} target="_blank" rel="noopener noreferrer">
                      <img src={item.image.path} alt="" className="w-14 h-14 object-cover rounded mx-auto border" />
                    </a>
                  ) : canWrite ? (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => { fileRefs.current[idx] = el }}
                        onChange={(e) => handleImageUpload(idx, e.target.files[0])}
                      />
                      <button
                        type="button"
                        disabled={uploading === idx}
                        onClick={() => fileRefs.current[idx]?.click()}
                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {uploading === idx ? 'กำลังอัปโหลด...' : '+ รูปภาพ'}
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td colSpan={5} className="px-3 py-2 text-right text-gray-700">ราคาประเมินรวม:</td>
              <td className="px-3 py-2 text-right text-red-700">{totalEstimated.toLocaleString()} บาท</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">ยืนยันการจำหน่ายครุภัณฑ์</h2>
            <p className="text-sm text-gray-500">กรอกข้อมูลการจำหน่าย ครุภัณฑ์ทั้งหมดจะถูกเปลี่ยนสถานะเป็น <span className="font-medium text-gray-700">จำหน่ายแล้ว</span></p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่จำหน่าย <span className="text-red-500">*</span></label>
              <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={completeForm.sale_date}
                onChange={(e) => setCompleteForm((f) => ({ ...f, sale_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่เอกสาร <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="เช่น นศ 0023.4/1234"
                value={completeForm.document_number}
                onChange={(e) => setCompleteForm((f) => ({ ...f, document_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ราคารวมที่จำหน่ายได้ (บาท)</label>
              <input type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder={`ค่าเริ่มต้น: ${totalEstimated.toLocaleString()}`}
                value={completeForm.total_price}
                onChange={(e) => setCompleteForm((f) => ({ ...f, total_price: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
              <textarea rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={completeForm.details}
                onChange={(e) => setCompleteForm((f) => ({ ...f, details: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เอกสาร PDF (ถ้ามี)</label>
              <input
                type="file"
                accept=".pdf,image/*"
                ref={docFileRef}
                className="hidden"
                onChange={(e) => setDocFile(e.target.files[0] || null)}
              />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => docFileRef.current?.click()}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                  แนบไฟล์
                </button>
                {docFile && <span className="text-xs text-gray-600">{docFile.name}</span>}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowCompleteModal(false)} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm hover:bg-gray-50">
                ยกเลิก
              </button>
              <button type="button" onClick={handleComplete} disabled={completing}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {completing ? 'กำลังบันทึก...' : '✅ ยืนยันจำหน่าย'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
