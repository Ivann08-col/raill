import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../services/api';

export default function RegisterScreen({ onSuccess, onBack }){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handleRegister = async () => {
    setErr('');
    try {
      const res = await api.post('/auth/register', { username: name, correo: email.trim().toLowerCase(), password });
      const data = res.data || {};
      onSuccess && onSuccess(data.usuario || { email: email.trim().toLowerCase() });
    } catch (e) {
      setErr('Error al registrar');
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      {err ? <Text style={styles.errText}>{err}</Text> : null}

      <Text style={styles.label}>Nombre</Text>
      <TextInput placeholder="Nombre" value={name} onChangeText={setName} style={styles.input} />

      <Text style={styles.label}>Correo</Text>
      <TextInput placeholder="correo@ejemplo.com" value={email} onChangeText={(t) => setEmail(t.toLowerCase())} style={styles.input} keyboardType="email-address" autoCapitalize="none" contextMenuHidden={true} />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister}>
        <Text style={styles.primaryBtnText}>Crear cuenta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.ghostBtn} onPress={onBack}>
        <Text style={styles.ghostBtnText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 6 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 10, color: '#111827' },
  errText: { color: '#dc2626', marginBottom: 8 },
  label: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#e6e9ef', padding: 10, borderRadius: 10, marginTop: 6, backgroundColor: '#fff' },
  primaryBtn: { marginTop: 14, backgroundColor: '#6f4ff3', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  ghostBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 10 },
  ghostBtnText: { color: '#6b7280', fontWeight: '700' }
});
