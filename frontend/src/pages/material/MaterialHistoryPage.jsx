import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

// ปีงบประมาณไทย: 1 ต.ค. – 30 ก.ย. ของปีถัดไป
// เช่น 2568 = 1 ต.ค. 2567 ถึง 30 ก.ย. 2568 (CE: 1 Oct 2024 – 30 Sep 2025)
function getFiscalYear(dateStr) {
  const d = new Date(dateStr)
  const month = d.getMonth() // 0=Jan ... 9=Oct
  const year = d.getFullYear()
  const fyGC = month >= 9 ? year + 1 : year
  return fyGC + 543 // Thai Buddhist year
}

const TYPE_LABEL = { receive: 'รับเข้า', withdraw: 'เบิกออก', adjust: 'ปรับยอด' }
const TYPE_COLOR = {
  receive: 'bg-green-100 text-green-800 border-green-200',
  withdraw: 'bg-orange-100 text-orange-800 border-orange-200',
  adjust: 'bg-blue-100 text-blue-800 border-blue-200',
}
const STATUS_LABEL = { pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธ' }
const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

function fmtDate(d, short = false) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', short
    ? { day: '2-digit', month: 'short', year: '2-digit' }
    : { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function MaterialHistoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [material, setMaterial] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)

  const canApprove = ['admin', 'staff', 'manager'].includes(user?.role)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/materials/${id}/transactions`)
      setMaterial(data.material)
      setTransactions(data.data || [])
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
      navigate('/material/transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (txId) => {
    if (!window.confirm('ยืนยันการอนุมัติ?')) return
    try {
      setApprovingId(txId)
      await api.post(`/materials/transactions/${txId}/approve`)
      toast.success('อนุมัติสำเร็จ')
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'ไม่สามารถอนุมัติได้')
    } finally {
      setApprovingId(null)
    }
  }

  if (loading) return <div className="text-center text-gray-500 py-12">กำลังโหลด...</div>
  if (!material) return <div className="text-center text-red-500 py-12">ไม่พบข้อมูลวัสดุ</div>

  // ── สถิติรวม ──
  const approved = transactions.filter((t) => t.status === 'approved')
  const firstReceive = approved.find((t) => t.type === 'receive')
  const totalReceiveQty = approved.filter((t) => t.type === 'receive').reduce((s, t) => s + t.quantity, 0)
  const withdrawList = approved.filter((t) => t.type === 'withdraw')
  const totalWithdrawQty = withdrawList.reduce((s, t) => s + t.quantity, 0)

  // ── แบ่งตามปีงบประมาณ (เรียงใหม่→เก่า) ──
  const byFY = {}
  transactions.forEach((tx) => {
    const fy = getFiscalYear(tx.createdAt)
    if (!byFY[fy]) byFY[fy] = []
    byFY[fy].push(tx)
  })
  const fiscalYears = Object.keys(byFY).map(Number).sort((a, b) => b - a)

  return (
    <div className="max-w-3xl space-y-5">
      {/* ←← กลับ */}
      <button
        type="button"
        onClick={() => navigate('/material/transactions')}
        className="text-blue-600 hover:underline text-sm"
      >
        ← กลับรายการวัสดุ
      </button>

      {/* ── ข้อมูลวัสดุ ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{material.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              ประเภท: {material.material_type_name} · หน่วย: {material.unit}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{material.department_name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-700">{material.quantity.toLocaleString()}</p>
            <p className="text-xs text-gray-500">คงเหลือปัจจุบัน ({material.unit})</p>
          </div>
        </div>

        {/* สถิติ */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="รับเข้าครั้งแรก" value={fmtDate(firstReceive?.createdAt, true)} color="text-gray-700" />
          <Stat label="รับเข้าทั้งหมด" value={`${totalReceiveQty.toLocaleString()} ${material.unit}`} color="text-green-700" />
          <Stat label="เบิกออก (ครั้ง)" value={`${withdrawList.length} ครั้ง`} color="text-orange-700" />
          <Stat label="เบิกออกทั้งหมด" value={`${totalWithdrawQty.toLocaleString()} ${material.unit}`} color="text-orange-700" />
        </div>
      </div>

      {/* ── ประวัติแยกปีงบประมาณ ── */}
      {fiscalYears.length === 0 ? (
        <p className="text-center text-gray-500 italic">ยังไม่มีประวัติ</p>
      ) : (
        fiscalYears.map((fy) => {
          const txList = byFY[fy]
          const fyReceive = txList.filter((t) => t.type === 'receive' && t.status === 'approved')
          const fyWithdraw = txList.filter((t) => t.type === 'withdraw' && t.status === 'approved')
          const fyReceiveQty = fyReceive.reduce((s, t) => s + t.quantity, 0)
          const fyWithdrawQty = fyWithdraw.reduce((s, t) => s + t.quantity, 0)
          const fyPending = txList.filter((t) => t.status === 'pending')

          return (
            <div key={fy} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* หัว FY */}
              <div className="flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">ปีงบประมาณ {fy}</h2>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-700">รับ {fyReceiveQty.toLocaleString()} {material.unit}</span>
                  <span className="text-orange-700">เบิก {fyWithdrawQty.toLocaleString()} {material.unit}</span>
                  {fyPending.length > 0 && (
                    <span className="text-yellow-700">รออนุมัติ {fyPending.length}</span>
                  )}
                </div>
              </div>

              {/* รายการใน FY (เรียงเก่า→ใหม่) */}
              <ul className="divide-y divide-gray-100">
                {[...txList].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((tx) => (
                  <li key={tx._id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50">
                    {/* dot */}
                    <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                      tx.type === 'receive' ? 'bg-green-500' :
                      tx.type === 'withdraw' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${TYPE_COLOR[tx.type]}`}>
                          {TYPE_LABEL[tx.type]}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {tx.type === 'adjust' ? `→ ${tx.quantity}` : `${tx.type === 'withdraw' ? '-' : '+'}${tx.quantity}`}
                          <span className="font-normal text-gray-500 text-xs ml-1">{material.unit}</span>
                        </span>
                        <span className="text-xs text-gray-400">
                          (ก่อน {tx.quantity_before} → หลัง {tx.quantity_after})
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[tx.status]}`}>
                          {STATUS_LABEL[tx.status]}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-500">
                        <span>📅 {fmtDate(tx.createdAt)}</span>
                        <span>👤 {tx.requested_by}</span>
                        {tx.approved_by && <span>✅ อนุมัติโดย {tx.approved_by}</span>}
                        {tx.reason && <span className="text-gray-600 italic">"{tx.reason}"</span>}
                      </div>
                    </div>

                    {/* ปุ่มอนุมัติ */}
                    {canApprove && tx.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(tx._id)}
                        disabled={approvingId === tx._id}
                        className="flex-shrink-0 rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {approvingId === tx._id ? '...' : 'อนุมัติ'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-semibold text-sm mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}
