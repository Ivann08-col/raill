import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';


export default function Navbar({ onAuthClick, user, setPage }){
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Synapse</Text>
      <View style={styles.right}>
        {user ? (
          <>
            <Text style={styles.user}>{user.email}</Text>
            <TouchableOpacity onPress={() => setPage && setPage('home')} style={styles.btn}>
              <Text style={styles.btnText}>Home</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => onAuthClick && onAuthClick('login')} style={[styles.btn, styles.login]}>
              <Text style={styles.btnText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onAuthClick && onAuthClick('register')} style={[styles.btn, styles.register]}>
              <Text style={styles.btnText}>Registrar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 56, paddingHorizontal: 16, backgroundColor: '#f5f6fa', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 18, fontWeight: '700', color: '#6b21a8' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  user: { marginRight: 8 },
  btn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#7c3aed', marginLeft: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  login: { backgroundColor: '#7c3aed' },
  register: { backgroundColor: '#6b7280' }
});
