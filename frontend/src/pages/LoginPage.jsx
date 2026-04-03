import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../lib/api'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/auth/login-url')
      if (!data?.login_url) {
        throw new Error('ไม่พบ login URL จากระบบ')
      }
      window.location.href = data.login_url
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'เข้าสู่ระบบไม่สำเร็จ')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-blue-100">
        <h1 className="text-2xl font-bold text-blue-800 text-center">PAPP</h1>
        <p className="mt-2 text-center text-gray-600">ระบบบริหารจัดการพัสดุ เทศบาลนครนครสวรรค์</p>
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'กำลังพาไปหน้า UMS...' : 'เข้าสู่ระบบด้วย UMS'}
        </button>
      </div>
    </div>
  )
}
