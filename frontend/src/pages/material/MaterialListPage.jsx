import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function MaterialListPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const importInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMaterials()
  }, [search])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/materials', { params: { q: search, limit: 500 } })
      setItems(data.data || [])
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลวัสดุได้')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const searchLabel = search ? `คำค้นหา: "${search}"` : ''
    const dateStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const rows = items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td class="nowrap">${item.material_type_name}</td>
        <td class="nowrap">${item.quantity} ${item.unit}</td>
        <td class="nowrap">${item.min_quantity}</td>
        <td class="nowrap">${item.quantity > item.min_quantity ? 'พอ' : 'น้อย'}</td>
        <td>${item.note || '-'}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>รายการวัสดุ</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; font-size: 13px; color: #111; padding: 20px; }
    h2 { font-size: 18px; margin-bottom: 4px; }
    .sub { font-size: 12px; color: #555; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; font-weight: 600; padding: 6px 8px; border: 1px solid #d1d5db; text-align: left; }
    td { padding: 5px 8px; border: 1px solid #d1d5db; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    .nowrap { white-space: nowrap; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h2>รายการวัสดุ</h2>
  <p class="sub">${searchLabel ? searchLabel + ' &nbsp;|&nbsp; ' : ''}พิมพ์วันที่ ${dateStr} &nbsp;|&nbsp; รวม ${items.length} รายการ</p>
  <table>
    <thead>
      <tr>
        <th>#</th><th>ชื่อวัสดุ</th><th>ประเภท</th><th>คงเหลือ</th><th>ขั้นต่ำ</th><th>สถานะ</th><th>หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/export/material', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `material-export-${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('ดาวน์โหลดไฟล์สำเร็จ')
    } catch (error) {
      toast.error('ไม่สามารถ Export ข้อมูลได้')
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/import/material/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'material-import-template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error('ไม่สามารถดาวน์โหลด Template ได้')
    }
  }

  const handleImportFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''

    const formData = new FormData()
    formData.append('file', file)

    try {
      setImporting(true)
      setImportResult(null)
      const { data } = await api.post('/import/material', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImportResult(data.data)
      if (data.data.success > 0) {
        fetchMaterials()
        toast.success(`นำเข้าสำเร็จ ${data.data.success} รายการ`)
      } else {
        toast('ไม่มีข้อมูลใหม่ที่นำเข้า', { icon: 'ℹ️' })
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'นำเข้าข้อมูลไม่สำเร็จ')
    } finally {
      setImporting(false)
    }
  }

  const handleWithdraw = async (id, currentQty) => {
    const qty = prompt('เบิกจำนวน:', '1')
    if (!qty) return

    try {
      await api.post(`/materials/${id}/transactions`, { 
        type: 'withdraw', 
        quantity: parseInt(qty) 
      })
      toast.success('เบิกวัสดุสำเร็จ (รอการอนุมัติ)')
      fetchMaterials()
    } catch (error) {
      toast.error(error.response?.data?.error || 'ไม่สามารถเบิกวัสดุได้')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">วัสดุ</h1>
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
            onClick={handleDownloadTemplate}
            className="rounded-lg bg-gray-500 px-4 py-2 font-medium text-white hover:bg-gray-600"
          >
            📋 Template
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
          >
            {importing ? 'กำลังนำเข้า...' : '📤 Import Excel'}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFileChange}
          />
          <button
            type="button"
            onClick={() => navigate('/material/transactions')}
            className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
          >
            📜 ประวัติ
          </button>
          <button
            type="button"
            onClick={() => navigate('/material/new')}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            + เพิ่มวัสดุ
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`rounded-lg border p-3 text-sm ${importResult.errors.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              ผลการนำเข้า: นำเข้าสำเร็จ {importResult.success}/{importResult.total} รายการ
              {importResult.skipped > 0 && ` | ข้าม ${importResult.skipped} รายการ`}
              {importResult.errors.length > 0 && ` | ผิดพลาด/ข้าม ${importResult.errors.length} รายการ`}
            </span>
            <button type="button" onClick={() => setImportResult(null)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-orange-700">
              {importResult.errors.map((e, i) => (
                <li key={i}>
                  <span className="font-mono text-xs bg-orange-100 px-1 rounded">แถว {e.row}</span>
                  {e.name && <span className="ml-1 text-xs text-gray-600">[{e.name}]</span>}
                  {' '}{e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="ค้นหาวัสดุ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
        />
        {!loading && items.length > 0 && (
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 whitespace-nowrap"
          >
            🖨️ พิมพ์ / PDF
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-600">กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-600">ไม่พบข้อมูลวัสดุ</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">ชื่อ</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">ประเภท</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">คงเหลือ</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">ขั้นต่ำ</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">สถานะ</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2">{item.material_type_name}</td>
                  <td className="px-4 py-2">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-2">{item.min_quantity}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.quantity > item.min_quantity
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {item.quantity > item.min_quantity ? 'พอ' : 'น้อย'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center space-x-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/material/${item._id}/edit`)}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWithdraw(item._id, item.quantity)}
                      className="text-green-600 hover:underline text-sm font-medium"
                    >
                      เบิก
                    </button>
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
