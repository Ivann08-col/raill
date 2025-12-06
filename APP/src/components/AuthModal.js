import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

export default function AuthModal({ open, mode = 'login', onClose, onAuthSuccess, openAuth }) {
  if (!open) return null;

  const handleSwitch = (nextMode) => {
    if (typeof openAuth === 'function') return openAuth(nextMode);
  };

  const content = mode === 'register'
    ? (
      <RegisterScreen
        onSuccess={(u) => onAuthSuccess && onAuthSuccess('register', u)}
        onBack={onClose}
      />
    )
    : (
      <LoginScreen
        onSuccess={(u) => onAuthSuccess && onAuthSuccess('login', u)}
        onBack={onClose}
      />
    );

  return (
    <Modal visible={!!open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Cerrar" style={styles.closeBtn}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>



          <View style={styles.content}>
            {content}
          </View>

          <View style={styles.footer}>
            {mode === 'register' ? (
              <TouchableOpacity onPress={() => handleSwitch('login')} style={styles.switchLink}>
                <Text style={styles.switchText}>¿Ya tienes cuenta? Iniciar sesión</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => handleSwitch('register')} style={styles.switchLink}>
                <Text style={styles.switchText}>¿No tienes cuenta? Registrarte</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,10,25,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    width: '94%',
    maxWidth: 460,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12
  },
  closeBtn: {
    position: 'absolute',
    right: 8,
    top: 6,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  closeText: { fontSize: 20, color: '#6b7280' },
  header: { paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 0, marginBottom: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  content: { marginTop: 6 },
  footer: { alignItems: 'center', marginTop: 8, paddingBottom: 2 },
  switchLink: { paddingVertical: 6 },
  switchText: { color: '#6b7280', fontWeight: '700' }
});
