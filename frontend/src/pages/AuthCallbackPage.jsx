import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { processCallback } = useAuth()

  useEffect(() => {
    let mounted = true

    const run = async () => {
      const token = searchParams.get('token')
      if (!token) {
        toast.error('ไม่พบ token จาก UMS')
        navigate('/login', { replace: true })
        return
      }

      try {
        await processCallback(token)
        if (mounted) {
          toast.success('เข้าสู่ระบบสำเร็จ')
          navigate('/', { replace: true })
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'ไม่สามารถเข้าสู่ระบบได้')
        if (mounted) {
          navigate('/login', { replace: true })
        }
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [searchParams, processCallback, navigate])

  return <div className="p-8 text-center text-gray-600">กำลังยืนยันตัวตนจาก UMS...</div>
}
