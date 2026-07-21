'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { btnPrimary } from '@/lib/styles';
import { acceptInvite } from '../actions';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState('Memeriksa undangan...');

  useEffect(() => {
    (async () => {
      const result = await acceptInvite(token);
      
      if (result.error) {
        setStatus(result.error);
        if (result.redirect) {
          setTimeout(() => router.push(result.redirect as string), 2000);
        }
        return;
      }

      setStatus('Berhasil bergabung! Mengarahkan ke proyek...');
      setTimeout(() => router.push('/'), 1500);
    })();
  }, [token, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FB' }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center' }}>
        <h2>Memproses Undangan</h2>
        <p style={{ color: '#64748B', marginTop: 12 }}>{status}</p>
        <button onClick={() => router.push('/')} style={{ ...btnPrimary, marginTop: 24 }}>Kembali ke Beranda</button>
      </div>
    </div>
  );
}
