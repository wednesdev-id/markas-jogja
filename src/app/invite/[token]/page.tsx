'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { btnPrimary } from '@/lib/styles';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState('Memeriksa undangan...');

  useEffect(() => {
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setStatus('Anda harus login terlebih dahulu.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      const { data: invite } = await supabase.from('invitations').select('*').eq('token', token).single();
      
      if (!invite) {
        setStatus('Tautan undangan tidak valid atau sudah kadaluarsa.');
        return;
      }

      // Add user to project_members
      const { error } = await supabase.from('project_members').insert({
        project_id: invite.project_id,
        user_id: authData.user.id,
        role: invite.role
      });

      if (error && error.code !== '23505') { // Ignore unique violation if already member
        setStatus('Gagal bergabung ke proyek: ' + error.message);
        return;
      }

      setStatus('Berhasil bergabung! Mengarahkan ke proyek...');
      setTimeout(() => router.push('/'), 1500);
    })();
  }, [token]);

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
