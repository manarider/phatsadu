import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const STATUS_CONFIG = {
  'ใช้งานได้':        { color: 'bg-green-50 border-green-200 text-green-700',  dot: 'bg-green-500' },
  'ชำรุด':            { color: 'bg-red-50 border-red-200 text-red-700',        dot: 'bg-red-500' },
  'อยู่ระหว่างซ่อม': { color: 'bg-yellow-50 border-yellow-200 text-yellow-700', dot: 'bg-yellow-500' },
  'รอตัดจำหน่าย':    { color: 'bg-orange-50 border-orange-200 text-orange-700', dot: 'bg-orange-500' },
  'จำหน่ายแล้ว':     { color: 'bg-gray-50 border-gray-200 text-gray-600',      dot: 'bg-gray-400' },
}

export default function EquipmentListPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [stats, setStats] = useState(null)
  const importInputRef = useRef(null)
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchDepartments()
    }
    fetchStats()
  }, [isAdmin])

  useEffect(() => {
    fetchEquipment()
  }, [search, department, page])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/equipment/stats')
      setStats(data.data)
    } catch {
      // ไม่แสดง error สำหรับ stats
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

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      const params = { q: search, page, limit: 200 }
      if (isAdmin && department) {
        params.department = department
      }
      const { data } = await api.get('/equipment', { params })
      setItems(data.data || [])
      setPagination(data.pagination)
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/export/equipment', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `equipment-export-${Date.now()}.xlsx`)
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
      const response = await api.get('/import/equipment/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'equipment-import-template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error('ไม่สามารถดาวน์โหลด Template ได้')
    }
  }

  const handlePrint = () => {
    const deptLabel = isAdmin
      ? (department || 'ทุกหน่วยงาน')
      : (user?.department_name || '')
    const searchLabel = search ? `คำค้นหา: "${search}"` : ''
    const dateStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    const rows = items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="mono">${item.asset_code}</td>
        <td>${item.name}</td>
        <td class="nowrap">${item.equipment_type_name}</td>
        <td class="nowrap">${item.status}</td>
        <td>${item.location || '-'}</td>
        <td class="nowrap">${item.custodian_name || '-'}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>รายการครุภัณฑ์</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; font-size: 13px; color: #111; padding: 20px; }
    h2 { font-size: 18px; margin-bottom: 4px; }
    .sub { font-size: 12px; color: #555; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; font-weight: 600; padding: 6px 8px; border: 1px solid #d1d5db; text-align: left; }
    td { padding: 5px 8px; border: 1px solid #d1d5db; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    .mono { font-family: monospace; }
    .nowrap { white-space: nowrap; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h2>รายการครุภัณฑ์ — ${deptLabel}</h2>
  <p class="sub">${searchLabel ? searchLabel + ' &nbsp;|&nbsp; ' : ''}พิมพ์วันที่ ${dateStr} &nbsp;|&nbsp; รวม ${items.length} รายการ</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>รหัสครุภัณฑ์</th>
        <th>ชื่อครุภัณฑ์</th>
        <th>ประเภท</th>
        <th>สถานะ</th>
        <th>ที่ตั้ง</th>
        <th>ผู้ดูแล</th>
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

  const handleImportFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''

    const formData = new FormData()
    formData.append('file', file)

    try {
      setImporting(true)
      setImportResult(null)
      const { data } = await api.post('/import/equipment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImportResult(data.data)
      if (data.data.success > 0) {
        fetchEquipment()
        fetchStats()
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

  return (
    <div className="space-y-4">
      {/* ─── Stats Cards ─────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex flex-col">
            <span className="text-xs text-blue-500 font-medium">ทั้งหมด</span>
            <span className="text-3xl font-bold text-blue-700 mt-1">{stats.total.toLocaleString()}</span>
            <span className="text-xs text-blue-400 mt-1">ครุภัณฑ์</span>
          </div>
          {/* By status */}
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <div key={status} className={`rounded-xl border px-4 py-3 flex flex-col ${cfg.color}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                <span className="text-xs font-medium leading-tight">{status}</span>
              </div>
              <span className="text-2xl font-bold mt-auto">
                {(stats.byStatus[status] ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          ครุภัณฑ์
          <span className="ml-2 text-base font-normal text-gray-500">
            {isAdmin ? 'ทุกหน่วยงาน' : user?.department_name || ''}
          </span>
        </h1>
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
            onClick={() => navigate('/equipment/new')}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            + เพิ่มครุภัณฑ์
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
                  {e.assetCode && <span className="ml-1 text-xs text-gray-600">[{e.assetCode}]</span>}
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
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
        />
        {isAdmin && (
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">-- ทุกหน่วยงาน --</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        )}
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
        <div className="text-center text-gray-600">ไม่พบข้อมูลครุภัณฑ์</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">รหัสครุภัณฑ์</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">ชื่อ</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">ประเภท</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">สถานะ</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">ที่ตั้ง</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/equipment/${item._id}`)}
                  >
                    <td className="px-4 py-2 font-mono font-medium whitespace-nowrap">{item.asset_code}</td>
                    <td className="px-4 py-2 break-words whitespace-normal min-w-[200px]">{item.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.equipment_type_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          item.status === 'ใช้งานได้'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{item.location || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                แสดง {items.length} จาก {pagination.total} รายการ
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ← ก่อนหน้า
                </button>
                <span className="px-3 py-1 text-sm">
                  หน้า {page} / {pagination.total_pages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages}
                  className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ถัดไป →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
