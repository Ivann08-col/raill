import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ user, onNavigate, openAuth }){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido{user ? `, ${user.email}` : ''}!</Text>
      <Text style={styles.subtitle}>Esta es la página de inicio de la app de ejemplo.</Text>
      <View style={{ marginTop: 20 }}>
        <Button title="Iniciar sesión" onPress={() => (openAuth ? openAuth('login') : onNavigate('login'))} />
      </View>
      <View style={{ marginTop: 10 }}>
        <Button title="Registrarse" onPress={() => (openAuth ? openAuth('register') : onNavigate('register'))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' }
});
