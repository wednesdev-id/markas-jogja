import { useState, useEffect } from 'react';
import { btnPrimary, inputStyle } from '@/lib/styles';
import { C } from '@/lib/utils';
import { getProjectMembersAction, createInviteAction } from '@/app/project/[slug]/clientActions';

export function ShareModal({ projectId, onClose }: { projectId: string, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getProjectMembersAction(projectId);
      if (data) setMembers(data);
    })();
  }, [projectId]);

  const generateLink = async () => {
    setLoading(true);
    const token = crypto.randomUUID();
    await createInviteAction(projectId, 'editor', token);
    setInviteLink(`${window.location.origin}/invite/${token}`);
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, width: 400, maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Bagikan Proyek</h3>
        
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 8 }}>Anggota saat ini:</div>
          {members.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.line}`, fontSize: 14 }}>
              <span>{m.profiles?.name || 'User'}</span>
              <span style={{ color: C.inkSoft, fontSize: 12, textTransform: 'capitalize' }}>{m.role}</span>
            </div>
          ))}
        </div>

        {inviteLink ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 8 }}>Tautan Undangan (Bagikan ini):</div>
            <input value={inviteLink} readOnly style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />
            <button onClick={() => navigator.clipboard.writeText(inviteLink)} style={{ ...btnPrimary, width: '100%', background: C.daun }}>Salin Tautan</button>
          </div>
        ) : (
          <button onClick={generateLink} disabled={loading} style={{ ...btnPrimary, width: '100%' }}>
            {loading ? 'Membuat Tautan...' : 'Buat Tautan Undangan'}
          </button>
        )}

        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.inkSoft, width: '100%', marginTop: 12, cursor: 'pointer', fontWeight: 600 }}>Tutup</button>
      </div>
    </div>
  );
}
