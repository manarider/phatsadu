import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../lib/api'

const STATUS_LABEL = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติแล้ว',
  in_progress: 'อยู่ระหว่างซ่อม',
  completed: 'ซ่อมเสร็จแล้ว',
  rejected: 'ไม่อนุมัติ',
}

export default function RepairPrintPage() {
  const { id } = useParams()
  const [repair, setRepair] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/repairs/${id}`)
      .then(({ data }) => setRepair(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!loading && repair) {
      window.print()
    }
  }, [loading, repair])

  if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
  if (!repair) return <div className="p-8 text-center text-red-500">ไม่พบข้อมูลการซ่อม</div>

  const fmt = (d) => d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
  const fmtNum = (n) => (n != null && n !== '') ? Number(n).toLocaleString('th-TH') : '-'

  return (
    <div className="print-page p-8 max-w-3xl mx-auto font-sans text-sm text-gray-900">
      {/* หัวกระดาษ */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-page, .print-page * { visibility: visible; }
          .print-page { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @page { size: A4; margin: 1.5cm; }
      `}</style>

      <div className="no-print mb-4 flex gap-3">
        <button
          onClick={() => window.print()}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          🖨️ พิมพ์ / บันทึก PDF
        </button>
        <button
          onClick={() => window.close()}
          className="rounded border px-4 py-2 text-gray-600 hover:bg-gray-100"
        >
          ✕ ปิด
        </button>
      </div>

      {/* ส่วนหัว */}
      <div className="text-center mb-6 border-b pb-4">
        <h1 className="text-xl font-bold">เทศบาลนครนครสวรรค์</h1>
        <h2 className="text-base font-semibold mt-1">ใบงานซ่อม / Repair Work Order</h2>
        <p className="text-xs text-gray-500 mt-1">เลขที่: {repair._id}</p>
      </div>

      {/* ข้อมูลหลัก */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
        <Row label="สถานะ" value={STATUS_LABEL[repair.status] || repair.status} />
        <Row label="วันที่แจ้ง" value={fmt(repair.createdAt)} />
        <Row label="ผู้แจ้ง" value={repair.requested_by || '-'} />
        <Row label="หน่วยงาน" value={repair.department_name || '-'} />
        <Row label="ผู้อนุมัติ" value={repair.approved_by || '-'} />
        <Row label="วันที่เสร็จ" value={fmt(repair.completed_at)} />
      </div>

      {/* รายการครุภัณฑ์ */}
      {repair.is_bulk ? (
        <section className="mb-6">
          <h3 className="font-semibold border-b pb-1 mb-2">รายการครุภัณฑ์ที่แจ้งซ่อม</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">ลำดับ</th>
                <th className="border px-2 py-1 text-left">รหัส</th>
                <th className="border px-2 py-1 text-left">ชื่อครุภัณฑ์</th>
                <th className="border px-2 py-1 text-left">ประเภท</th>
                <th className="border px-2 py-1 text-left">หน่วยงาน</th>
              </tr>
            </thead>
            <tbody>
              {(repair.equipment_items || []).map((eq, i) => (
                <tr key={i} className="even:bg-gray-50">
                  <td className="border px-2 py-1">{i + 1}</td>
                  <td className="border px-2 py-1">{eq.equipment_eqid || '-'}</td>
                  <td className="border px-2 py-1">{eq.equipment_name || '-'}</td>
                  <td className="border px-2 py-1">{eq.equipment_type || '-'}</td>
                  <td className="border px-2 py-1">{eq.department_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="mb-6">
          <h3 className="font-semibold border-b pb-1 mb-2">ข้อมูลครุภัณฑ์</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <Row label="รหัสครุภัณฑ์" value={repair.equipment_eqid || '-'} />
            <Row label="ชื่อครุภัณฑ์" value={repair.equipment_name || '-'} />
            <Row label="ที่ตั้ง" value={repair.equipment_location || '-'} />
            <Row label="หน่วยงาน" value={repair.department_name || '-'} />
          </div>
        </section>
      )}

      {/* รายละเอียดปัญหา */}
      <section className="mb-6">
        <h3 className="font-semibold border-b pb-1 mb-2">รายละเอียดปัญหา</h3>
        <p className="whitespace-pre-wrap text-gray-800">{repair.problem_detail || '-'}</p>
      </section>

      {/* ผลการซ่อม */}
      {repair.status === 'completed' && (
        <section className="mb-6">
          <h3 className="font-semibold border-b pb-1 mb-2">ผลการซ่อม</h3>

          {repair.repair_result && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500">รายละเอียด</p>
              <p className="whitespace-pre-wrap text-gray-800">{repair.repair_result}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
            <Row label="ผู้ซ่อม/ร้านซ่อม" value={repair.repairer || '-'} />
            <Row label="หมายเหตุ" value={repair.repair_note || '-'} />
          </div>

          {Array.isArray(repair.repair_items) && repair.repair_items.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-500 mb-1">รายการซ่อม</p>
              <table className="w-full border-collapse text-xs mb-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">ลำดับ</th>
                    <th className="border px-2 py-1 text-left">รายการ</th>
                    <th className="border px-2 py-1 text-right">จำนวน</th>
                    <th className="border px-2 py-1 text-right">ราคา/หน่วย</th>
                    <th className="border px-2 py-1 text-right">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {repair.repair_items.map((row, i) => (
                    <tr key={i} className="even:bg-gray-50">
                      <td className="border px-2 py-1">{i + 1}</td>
                      <td className="border px-2 py-1">{row.description}</td>
                      <td className="border px-2 py-1 text-right">{row.quantity}</td>
                      <td className="border px-2 py-1 text-right">{fmtNum(row.price)}</td>
                      <td className="border px-2 py-1 text-right">{fmtNum(row.quantity * row.price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold bg-gray-50">
                    <td className="border px-2 py-1" colSpan={4}>รวมค่าซ่อมทั้งหมด</td>
                    <td className="border px-2 py-1 text-right">{fmtNum(repair.repair_total_price)} บาท</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </section>
      )}

      {/* ลายเซ็น */}
      <div className="mt-12 grid grid-cols-3 gap-4 text-center text-xs">
        <SignBox label="ผู้แจ้งซ่อม" />
        <SignBox label="ผู้อนุมัติ" />
        <SignBox label="ผู้รับมอบ" />
      </div>

      {/* ท้ายกระดาษ */}
      <p className="mt-8 text-center text-xs text-gray-400">
        พิมพ์เมื่อ {new Date().toLocaleString('th-TH')} · ระบบบริหารจัดการพัสดุ เทศบาลนครนครสวรรค์
      </p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="w-36 flex-shrink-0 font-medium text-gray-600">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}

function SignBox({ label }) {
  return (
    <div>
      <div className="h-16 border-b border-dashed border-gray-400" />
      <p className="mt-1 text-gray-600">{label}</p>
      <p className="text-gray-400">ลงชื่อ .......................................</p>
      <p className="text-gray-400">วันที่ .......................................</p>
    </div>
  )
}
