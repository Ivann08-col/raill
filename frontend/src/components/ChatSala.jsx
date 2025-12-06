import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ChatSala({ salaId, salaNombre }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');

    useEffect(() => {
        // Placeholder: load recent messages (if backend endpoint exists)
        let mounted = true;
        api.get(`/salas/${salaId}/mensajes`).then(r => {
            if (mounted) setMessages(r.data || []);
        }).catch(() => {
            // ignore if endpoint not implemented
        });
        return () => { mounted = false; };
    }, [salaId]);

    async function sendMessage() {
        if (!text.trim()) return;
        try {
            const payload = { contenido: text };
            // Try POST to REST endpoint; if not present this will fail silently
            const res = await api.post(`/salas/${salaId}/mensajes`, payload).then(r => r.data).catch(() => null);
            if (res) setMessages(prev => [...prev, res]);
            setText('');
        } catch (e) {
            console.error('Error sending message', e);
        }
    }

    return (
        <div>
            <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
                {messages.length === 0 && <div style={{ color: '#666' }}>No hay mensajes aún.</div>}
                {messages.map((m, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: '#444' }}>{m.autor_nombre || m.autor_id}</div>
                        <div style={{ background: '#f3f4f6', padding: 8, borderRadius: 8 }}>{m.contenido || m.mensaje || m.text}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={text} onChange={e => setText(e.target.value)} placeholder="Escribe un mensaje..." style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #ddd' }} />
                <button onClick={sendMessage} style={{ padding: '8px 12px', borderRadius: 8 }}>Enviar</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>Nota: este chat es una implementación mínima. Para tiempo real usa Socket.IO backend.</div>
        </div>
    );
}
