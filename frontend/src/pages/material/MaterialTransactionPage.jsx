import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function MaterialTransactionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const canApprove = ['admin', 'staff', 'manager'].includes(user?.role)

  useEffect(() => { fetchTransactions() }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/materials/transactions/all')
      setTransactions(data.data || [])
    } catch {
      toast.error('ไม่สามารถโหลดประวัติได้')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (txId, e) => {
    e.stopPropagation()
    if (!window.confirm('ยืนยันการอนุมัติรายการนี้?')) return
    try {
      await api.post(`/materials/transactions/${txId}/approve`)
      toast.success('อนุมัติสำเร็จ')
      await fetchTransactions()
    } catch (error) {
      toast.error(error.response?.data?.error || 'ไม่สามารถอนุมัติได้')
    }
  }

  // Group transactions by material_id → 1 row per material
  const grouped = Object.values(
    transactions.reduce((acc, tx) => {
      const key = tx.material_id
      if (!acc[key]) {
        acc[key] = {
          material_id: tx.material_id,
          material_name: tx.material_name,
          department_name: tx.department_name,
          unit: '',
          receive_count: 0,
          receive_qty: 0,
          withdraw_count: 0,
          withdraw_qty: 0,
          pending_count: 0,
          first_receive: null,
          last_qty: tx.quantity_after,
          transactions: [],
        }
      }
      acc[key].transactions.push(tx)
      if (tx.type === 'receive' && tx.status === 'approved') {
        acc[key].receive_count++
        acc[key].receive_qty += tx.quantity
        if (!acc[key].first_receive || new Date(tx.createdAt) < new Date(acc[key].first_receive)) {
          acc[key].first_receive = tx.createdAt
        }
      }
      if (tx.type === 'withdraw' && tx.status === 'approved') {
        acc[key].withdraw_count++
        acc[key].withdraw_qty += tx.quantity
      }
      if (tx.status === 'pending') {
        acc[key].pending_count++
      }
      // ใช้ quantity_after ล่าสุดเป็นยอดปัจจุบัน
      if (new Date(tx.createdAt) >= new Date(acc[key]._latestDate || 0)) {
        acc[key]._latestDate = tx.createdAt
        acc[key].last_qty = tx.quantity_after
      }
      return acc
    }, {})
  ).sort((a, b) => a.material_name.localeCompare(b.material_name, 'th'))

  const filtered = grouped.filter((g) =>
    !search || g.material_name.toLowerCase().includes(search.toLowerCase())
  )

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/material')} className="text-blue-600 hover:underline text-sm">
          ← กลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900">ประวัติการรับ/เบิกวัสดุ</h1>
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อวัสดุ..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-64"
        />
        <span className="text-sm text-gray-500">{filtered.length} รายการวัสดุ</span>
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-8">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-8">ไม่พบข้อมูล</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ชื่อวัสดุ</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">หน่วยงาน</th>
                <th className="px-4 py-3 text-center font-semibold text-green-700">รับเข้า (ครั้ง/จำนวน)</th>
                <th className="px-4 py-3 text-center font-semibold text-orange-700">เบิกออก (ครั้ง/จำนวน)</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">รับครั้งแรก</th>
                {canApprove && (
                  <th className="px-4 py-3 text-center font-semibold text-yellow-700">รออนุมัติ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr
                  key={g.material_id}
                  onClick={() => navigate(`/material/${g.material_id}/history`)}
                  className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{g.material_name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{g.department_name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-green-700 font-medium">{g.receive_count} ครั้ง</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-green-600">{g.receive_qty.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-orange-700 font-medium">{g.withdraw_count} ครั้ง</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-orange-600">{g.withdraw_qty.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">{fmtDate(g.first_receive)}</td>
                  {canApprove && (
                    <td className="px-4 py-3 text-center">
                      {g.pending_count > 0 ? (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          {g.pending_count} รายการ
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400">คลิกที่แถวเพื่อดูประวัติรายละเอียด</p>
    </div>
  )
}
