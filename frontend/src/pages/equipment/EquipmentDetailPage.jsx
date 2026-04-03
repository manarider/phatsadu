import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function EquipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [maintenance, setMaintenance] = useState([])
  const [repairs, setRepairs] = useState([])

  useEffect(() => {
    fetchEquipment()
    fetchMaintenance()
    fetchRepairs()
  }, [id])

  const fetchEquipment = async () => {
    try {
      const { data } = await api.get(`/equipment/${id}`)
      setItem(data.data)
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้')
      navigate('/equipment')
    } finally {
      setLoading(false)
    }
  }

  const fetchMaintenance = async () => {
    try {
      const { data } = await api.get('/maintenance', { params: { equipment_id: id, limit: 5 } })
      setMaintenance(data.data || [])
    } catch {}
  }

  const fetchRepairs = async () => {
    try {
      const { data } = await api.get('/repairs', { params: { equipment_id: id, limit: 50 } })
      setRepairs(data.data || [])
    } catch {}
  }

  if (loading) {
    return <div className="text-center text-gray-600">กำลังโหลด...</div>
  }

  if (!item) {
    return <div className="text-center text-red-600">ไม่พบครุภัณฑ์นี้</div>
  }

  return (
    <div className="max-w-4xl space-y-4">
      <button
        type="button"
        onClick={() => navigate('/equipment')}
        className="text-blue-600 hover:underline"
      >
        ← กลับไปรายการ
      </button>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name || '-'}</h1>
            <p className="text-sm text-gray-600">EQID: {item.eqid || '-'}</p>
          </div>
          <div className="flex gap-2">
            {maintenance.some((m) => m.status === 'pending' && new Date(m.scheduled_date) < new Date()) && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                ⚠️ บำรุงรักษาเกินกำหนด
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate(`/maintenance/new?equipment_id=${id}`)}
              className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 text-sm"
            >
              🔧 เพิ่มแผนบำรุงรักษา
            </button>
            <button
              type="button"
              onClick={() => navigate(`/equipment/${id}/edit`)}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              แก้ไข
            </button>
          </div>
        </div>

        {/* ข้อมูลครุภัณฑ์ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">รหัสครุภัณฑ์</p>
            <p className="text-gray-900">{item.asset_code || '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">ชื่อครุภัณฑ์</p>
            <p className="text-gray-900">{item.name || '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">ซีเรียล</p>
            <p className="text-gray-900">{item.serial_number || '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">ประเภท</p>
            <p className="text-gray-900">{item.equipment_type_name || '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">ที่ตั้ง</p>
            <p className="text-gray-900">{item.location || '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">ราคา</p>
            <p className="text-gray-900">{item.price ? `${item.price.toLocaleString()} บาท` : '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">ผู้ดูแล</p>
            <p className="text-gray-900">{item.custodian_name || '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">วันที่ได้มา</p>
            <p className="text-gray-900">
              {item.acquired_date ? new Date(item.acquired_date).toLocaleDateString('th-TH') : '-'}
            </p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">สถานะ</p>
            <p className="text-gray-900">{item.status || '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">หน่วยงานเจ้าของครุภัณฑ์</p>
            <p className="text-gray-900">{item.department_name || '-'}</p>
          </div>
        </div>

        {/* ฟิลด์แบบเต็มความกว้าง */}
        <div className="mt-4 space-y-4">
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">รายละเอียดครุภัณฑ์</p>
            <p className="text-gray-900 whitespace-pre-wrap">{item.description || '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">โครงการ</p>
            <p className="text-gray-900">{item.project || '-'}</p>
          </div>
          <div className="border-b pb-3">
            <p className="font-medium text-gray-600">หมายเหตุ</p>
            <p className="text-gray-900 whitespace-pre-wrap">{item.note || '-'}</p>
          </div>
        </div>

        {/* รูปภาพ */}
        <div className="mt-6">
          <p className="font-medium text-gray-600 mb-2">รูปภาพ</p>
          {item.image?.path ? (
            <img
              src={encodeURI(`${import.meta.env.BASE_URL}${item.image.path.replace(/^\//, '')}`)}
              alt={item.name || 'ครุภัณฑ์'}
              className="max-w-md rounded-lg border"
            />
          ) : (
            <p className="text-gray-500 italic">ไม่มีภาพประกอบ</p>
          )}
        </div>
      </div>

      {/* ─── ประวัติการซ่อม ─────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">ประวัติการซ่อม</h3>
          <button
            type="button"
            onClick={() => navigate('/repair')}
            className="text-sm text-blue-600 hover:underline"
          >
            ดูทั้งหมด →
          </button>
        </div>
        {repairs.length === 0 ? (
          <p className="text-sm text-gray-500 italic">ยังไม่มีประวัติการซ่อม</p>
        ) : (
          <div className="space-y-2">
            {repairs.map((r) => {
              const statusLabel = {
                pending: 'รอดำเนินการ',
                approved: 'อนุมัติแล้ว',
                in_progress: 'อยู่ระหว่างซ่อม',
                completed: 'ซ่อมเสร็จแล้ว',
                rejected: 'ไม่อนุมัติ',
              }
              const statusColor = {
                pending: 'bg-yellow-100 text-yellow-800',
                approved: 'bg-blue-100 text-blue-800',
                in_progress: 'bg-orange-100 text-orange-800',
                completed: 'bg-green-100 text-green-800',
                rejected: 'bg-red-100 text-red-800',
              }
              return (
                <div
                  key={r._id}
                  onClick={() => navigate(`/repair/${r._id}`)}
                  className="flex items-start justify-between cursor-pointer rounded-lg border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {r.is_bulk
                        ? `แจ้งซ่อมหลายรายการ (${r.equipment_items?.length || 0} รายการ)`
                        : r.problem_detail}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      แจ้งโดย: {r.requested_by}
                      <span className="mx-2">·</span>
                      {new Date(r.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`ml-3 flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium ${statusColor[r.status] || 'bg-gray-100 text-gray-700'}`}>
                    {statusLabel[r.status] || r.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── ประวัติการบำรุงรักษา ─────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">ประวัติการบำรุงรักษา</h3>
          <button
            type="button"
            onClick={() => navigate(`/maintenance?equipment_id=${id}`)}
            className="text-sm text-blue-600 hover:underline"
          >
            ดูทั้งหมด →
          </button>
        </div>
        {maintenance.length === 0 ? (
          <p className="text-sm text-gray-500 italic">ยังไม่มีแผนบำรุงรักษา</p>
        ) : (
          <ul className="space-y-2">
            {maintenance.map((m) => {
              const isOverdue = m.status === 'pending' && new Date(m.scheduled_date) < new Date()
              return (
                <li key={m._id} className={`flex items-center justify-between rounded p-2 text-sm ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div>
                    <span className="font-medium">{m.maintenance_type}</span>
                    <span className="mx-2 text-gray-400">—</span>
                    <span className="text-gray-600">{new Date(m.scheduled_date).toLocaleDateString('th-TH')}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    m.status === 'done' ? 'bg-green-100 text-green-800' :
                    isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {m.status === 'done' ? 'เสร็จสิ้น' : isOverdue ? 'เกินกำหนด' : 'รอดำเนินการ'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
