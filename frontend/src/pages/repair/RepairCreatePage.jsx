import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../lib/api'

// ─── Single Mode ──────────────────────────────────────────────────────────────
function SingleRepairForm({ navigate }) {
  const [loading, setLoading] = useState(false)
  const [searchCode, setSearchCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundEquipment, setFoundEquipment] = useState(null)
  const [problemDetail, setProblemDetail] = useState('')
  const [equipmentId, setEquipmentId] = useState('')

  const handleSearch = async () => {
    const code = searchCode.trim()
    if (!code) { toast.error('กรุณากรอกรหัสครุภัณฑ์'); return }
    setSearching(true)
    setFoundEquipment(null)
    setEquipmentId('')
    try {
      const { data } = await api.get('/equipment', { params: { q: code, limit: 10 } })
      const list = data.data || []
      const match = list.find(
        (item) =>
          item.eqid?.toLowerCase() === code.toLowerCase() ||
          item.asset_code?.toLowerCase() === code.toLowerCase()
      )
      if (match) {
        setFoundEquipment(match)
        setEquipmentId(match._id)
      } else {
        toast.error('ไม่พบครุภัณฑ์ในหน่วยงานของคุณ')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการค้นหา')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!equipmentId) { toast.error('กรุณาค้นหาและเลือกครุภัณฑ์ก่อน'); return }
    if (!problemDetail.trim()) { toast.error('กรุณากรอกรายละเอียดปัญหา'); return }
    setLoading(true)
    try {
      await api.post('/repairs', { equipment_id: equipmentId, problem_detail: problemDetail })
      toast.success('แจ้งซ่อมสำเร็จ')
      navigate('/repair')
    } catch (error) {
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          รหัสครุภัณฑ์ <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            placeholder="กรอก EQID หรือรหัสทรัพย์สิน"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {searching ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>
        </div>
        {foundEquipment && (
          <div className="mt-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm space-y-1">
            <p className="font-medium text-green-800">พบครุภัณฑ์</p>
            <p className="text-gray-700"><span className="font-medium">ชื่อ:</span> {foundEquipment.name}</p>
            <p className="text-gray-700"><span className="font-medium">ประเภท:</span> {foundEquipment.equipment_type_name || '-'}</p>
            <p className="text-gray-700">
              <span className="font-medium">สถานะ:</span>{' '}
              <span className={foundEquipment.status === 'ใช้งานได้' ? 'text-green-700' : foundEquipment.status === 'ชำรุด' ? 'text-red-700' : 'text-yellow-700'}>
                {foundEquipment.status}
              </span>
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          รายละเอียดปัญหา <span className="text-red-500">*</span>
        </label>
        <textarea
          value={problemDetail}
          onChange={(e) => setProblemDetail(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="อธิบายปัญหาที่พบ..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !equipmentId}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'กำลังบันทึก...' : 'แจ้งซ่อม'}
        </button>
        <button type="button" onClick={() => navigate('/repair')} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
          ยกเลิก
        </button>
      </div>
    </form>
  )
}

// ─── Bulk Mode ────────────────────────────────────────────────────────────────
function BulkRepairForm({ navigate }) {
  const [loading, setLoading] = useState(false)
  const [codesInput, setCodesInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null) // { valid: [], invalid: [] }
  const [problemDetail, setProblemDetail] = useState('')

  const parseCodes = () =>
    codesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

  const handleVerify = async () => {
    const codes = parseCodes()
    if (codes.length === 0) { toast.error('กรุณากรอกรหัสครุภัณฑ์อย่างน้อย 1 รายการ'); return }
    setVerifying(true)
    setVerifyResult(null)
    try {
      // Fetch all equipment matching each code; use Promise.allSettled for concurrency
      const results = await Promise.allSettled(
        codes.map((code) =>
          api.get('/equipment', { params: { q: code, limit: 10 } }).then(({ data }) => {
            const list = data.data || []
            const match = list.find(
              (item) =>
                item.eqid?.toLowerCase() === code.toLowerCase() ||
                item.asset_code?.toLowerCase() === code.toLowerCase()
            )
            return { code, found: !!match }
          })
        )
      )
      const valid = []
      const invalid = []
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          r.value.found ? valid.push(r.value.code) : invalid.push(r.value.code)
        } else {
          invalid.push('ข้อผิดพลาด')
        }
      })
      setVerifyResult({ valid, invalid })
    } catch {
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบ')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const codes = parseCodes()
    if (codes.length === 0) { toast.error('กรุณากรอกรหัสครุภัณฑ์'); return }
    if (!problemDetail.trim()) { toast.error('กรุณากรอกรายละเอียดปัญหา'); return }
    if (!verifyResult) { toast.error('กรุณากดตรวจสอบรหัสครุภัณฑ์ก่อน'); return }
    if (verifyResult.valid.length === 0) { toast.error('ไม่มีรหัสครุภัณฑ์ที่ถูกต้อง'); return }

    setLoading(true)
    try {
      const { data } = await api.post('/repairs/bulk', {
        equipment_codes: verifyResult.valid,
        problem_detail: problemDetail,
      })
      const msg = data.not_found?.length > 0
        ? `แจ้งซ่อมสำเร็จ (${verifyResult.valid.length} รายการ) ไม่พบ ${data.not_found.length} รายการ`
        : `แจ้งซ่อมสำเร็จ (${verifyResult.valid.length} รายการ)`
      toast.success(msg)
      navigate('/repair')
    } catch (error) {
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          รหัสครุภัณฑ์ (คั่นด้วย <code className="bg-gray-100 px-1 rounded">,</code>) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={codesInput}
            onChange={(e) => { setCodesInput(e.target.value); setVerifyResult(null) }}
            placeholder="เช่น EQ-001, EQ-002, EQ-003"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {verifying ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ'}
          </button>
        </div>

        {verifyResult && (
          <div className="mt-2 space-y-2 text-sm">
            {verifyResult.valid.length > 0 && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2">
                <p className="font-medium text-green-800 mb-1">พบในระบบ ({verifyResult.valid.length} รายการ)</p>
                <p className="text-green-700">{verifyResult.valid.join(', ')}</p>
              </div>
            )}
            {verifyResult.invalid.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <p className="font-medium text-red-800 mb-1">ไม่พบในระบบ ({verifyResult.invalid.length} รายการ)</p>
                <p className="text-red-700">{verifyResult.invalid.join(', ')}</p>
                <p className="text-red-600 text-xs mt-1">รหัสเหล่านี้จะไม่ถูกแจ้งซ่อม</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          รายละเอียดปัญหา <span className="text-red-500">*</span>
        </label>
        <textarea
          value={problemDetail}
          onChange={(e) => setProblemDetail(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="อธิบายปัญหาที่พบ..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !verifyResult || verifyResult.valid.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'กำลังบันทึก...' : `แจ้งซ่อม${verifyResult?.valid.length ? ` (${verifyResult.valid.length} รายการ)` : ''}`}
        </button>
        <button type="button" onClick={() => navigate('/repair')} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
          ยกเลิก
        </button>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RepairCreatePage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('single') // 'single' | 'bulk'

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <button
        type="button"
        onClick={() => navigate('/repair')}
        className="text-blue-600 hover:underline text-sm"
      >
        ← กลับไปรายการ
      </button>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">แจ้งซ่อมครุภัณฑ์</h1>

        {/* Mode tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'single' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            รายการเดี่ยว
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'bulk' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            หลายรายการพร้อมกัน
          </button>
        </div>

        {mode === 'single' ? (
          <SingleRepairForm navigate={navigate} />
        ) : (
          <BulkRepairForm navigate={navigate} />
        )}
      </div>
    </div>
  )
}

