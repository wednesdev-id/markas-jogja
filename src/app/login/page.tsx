'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, signup } from './actions'
import { C, lurikCSS } from '@/lib/utils'
import { inputStyle, btnPrimary } from '@/lib/styles'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    try {
      const res = isLogin ? await login(formData) : await signup(formData)
      if (res?.error) setErrorMsg(res.error)
      else if (res?.success) router.push('/')
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FB' }}>
      <div style={{ maxWidth: 420, width: '100%', background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ height: 10, background: lurikCSS(0) }} />
        <div style={{ padding: 32 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 26, textAlign: 'center', marginBottom: 24 }}>
            {isLogin ? 'Masuk ke Markas' : 'Daftar Markas'}
          </div>
          
          {errorMsg && (
            <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 20 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 6 }}>Email</label>
              <input name="email" type="email" required placeholder="nama@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 6 }}>Password</label>
              <input name="password" type="password" required placeholder="Minimal 6 karakter" minLength={6} style={inputStyle} />
            </div>
            
            <button disabled={loading} style={{ ...btnPrimary, width: "100%", marginTop: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar & Buat Akun')}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: C.inkSoft }}>
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
