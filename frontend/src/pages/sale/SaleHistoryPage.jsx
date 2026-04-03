import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'

function thaiDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function SaleHistoryPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => { fetchHistory() }, [page])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/sale/history', { params: { page, limit: 20 } })
      setRecords(data.data || [])
      setPagination(data.pagination)
    } catch {
      toast.error('ไม่สามารถโหลดประวัติได้')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = (record) => {
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    const rows = (record.items || []).map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-family:monospace">${it.asset_code}</td>
        <td>${it.name}</td>
        <td>${it.equipment_type_name}</td>
        <td>${it.department_name}</td>
        <td style="text-align:right">${(it.estimated_price || 0).toLocaleString()}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"/><title>ประวัติการจำหน่าย</title>
<style>
* { margin:0;padding:0;box-sizing:border-box }
body { font-family:'Sarabun','TH Sarabun New',sans-serif; font-size:13px; padding:20px }
h2 { font-size:18px; margin-bottom:4px }
.sub,.info { font-size:12px; color:#444; margin-bottom:6px }
table { width:100%; border-collapse:collapse; margin-top:10px }
th { background:#f3f4f6; padding:6px 8px; border:1px solid #d1d5db; text-align:left; font-weight:600 }
td { padding:5px 8px; border:1px solid #d1d5db }
tr:nth-child(even) td { background:#f9fafb }
.total { text-align:right; margin-top:8px; font-weight:bold }
</style></head>
<body>
<h2>ประวัติการจำหน่ายครุภัณฑ์</h2>
<div class="info">เลขที่เอกสาร: <b>${record.document_number}</b> &nbsp;|&nbsp; วันที่จำหน่าย: ${thaiDate(record.sale_date)} &nbsp;|&nbsp; ปีงบประมาณ: ${record.fiscal_year}</div>
<div class="info">รายละเอียด: ${record.details || '-'}</div>
<div class="info">พิมพ์วันที่: ${dateStr}</div>
<table>
  <thead><tr><th>#</th><th>รหัส</th><th>ชื่อครุภัณฑ์</th><th>ประเภท</th><th>หน่วยงาน</th><th style="text-align:right">ราคาประเมิน</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<p class="total">ราคารวมที่จำหน่ายได้: ${(record.total_price || 0).toLocaleString()} บาท</p>
</body></html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ประวัติการจำหน่ายครุภัณฑ์</h1>
        <button type="button" onClick={() => navigate('/sale')}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
          ← กลับ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">กำลังโหลด...</div>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-400">
          ยังไม่มีประวัติการจำหน่าย
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <div key={rec._id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              {/* Row header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === rec._id ? null : rec._id)}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-semibold text-gray-800">{thaiDate(rec.sale_date)}</span>
                  <span className="text-sm text-gray-500">เลขที่: <span className="font-mono">{rec.document_number}</span></span>
                  <span className="text-sm text-gray-500">ปีงบฯ: {rec.fiscal_year}</span>
                  <span className="text-sm font-medium text-red-700">{(rec.total_price || 0).toLocaleString()} บาท</span>
                  <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-0.5">{rec.items?.length || 0} รายการ</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={(e) => { e.stopPropagation(); handlePrint(rec) }}
                    className="rounded border border-purple-300 px-3 py-1 text-xs text-purple-600 hover:bg-purple-50">
                    🖨️ พิมพ์
                  </button>
                  {rec.document_file?.path && (
                    <a href={rec.document_file.path} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border border-blue-300 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50">
                      📄 เอกสาร
                    </a>
                  )}
                  <span className="text-gray-400 text-sm">{expanded === rec._id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded items */}
              {expanded === rec._id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  {rec.details && <p className="text-sm text-gray-600 mb-3">รายละเอียด: {rec.details}</p>}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-3 py-1.5 text-left">#</th>
                          <th className="border border-gray-200 px-3 py-1.5 text-left whitespace-nowrap">รหัสครุภัณฑ์</th>
                          <th className="border border-gray-200 px-3 py-1.5 text-left">ชื่อ</th>
                          <th className="border border-gray-200 px-3 py-1.5 text-left whitespace-nowrap">ประเภท</th>
                          <th className="border border-gray-200 px-3 py-1.5 text-left whitespace-nowrap">หน่วยงาน</th>
                          <th className="border border-gray-200 px-3 py-1.5 text-right whitespace-nowrap">ราคาประเมิน</th>
                          <th className="border border-gray-200 px-3 py-1.5 text-center">รูป</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rec.items || []).map((it, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-3 py-1.5 text-gray-500">{i + 1}</td>
                            <td className="border border-gray-200 px-3 py-1.5 font-mono whitespace-nowrap">{it.asset_code}</td>
                            <td className="border border-gray-200 px-3 py-1.5">{it.name}</td>
                            <td className="border border-gray-200 px-3 py-1.5 whitespace-nowrap">{it.equipment_type_name}</td>
                            <td className="border border-gray-200 px-3 py-1.5 whitespace-nowrap">{it.department_name}</td>
                            <td className="border border-gray-200 px-3 py-1.5 text-right whitespace-nowrap">{(it.estimated_price || 0).toLocaleString()}</td>
                            <td className="border border-gray-200 px-3 py-1.5 text-center">
                              {it.image?.path ? (
                                <a href={it.image.path} target="_blank" rel="noopener noreferrer">
                                  <img src={it.image.path} alt="" className="w-10 h-10 object-cover rounded mx-auto" />
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">รวม {pagination.total} รายการ</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50">← ก่อนหน้า</button>
            <span className="px-3 py-1 text-sm">หน้า {page} / {pagination.total_pages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))} disabled={page === pagination.total_pages}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50">ถัดไป →</button>
          </div>
        </div>
      )}
    </div>
  )
}
