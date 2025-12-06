import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import Navbar from './src/components/Navbar';
import AuthModal from './src/components/AuthModal';

export default function App() {
  const [route, setRoute] = useState('home');
  const [user, setUser] = useState(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const navigate = (r) => setRoute(r);

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const closeAuth = () => setAuthOpen(false);

  const handleAuthSuccess = (type, u) => {
    // type is 'login' or 'register'
    setUser(u);
    setAuthOpen(false);
    setRoute('home');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Navbar user={user} onAuthClick={openAuth} setPage={navigate} />

  {route === 'home' && <HomeScreen user={user} onNavigate={navigate} openAuth={openAuth} />}

      {/* Keep the full-screen routes as fallback (not used when modal is open) */}
      {route === 'login' && <LoginScreen onSuccess={(u) => { setUser(u); setRoute('home'); }} onBack={() => setRoute('home')} />}
      {route === 'register' && <RegisterScreen onSuccess={(u) => { setUser(u); setRoute('home'); }} onBack={() => setRoute('home')} />}

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={closeAuth}
        onAuthSuccess={handleAuthSuccess}
        openAuth={(m) => openAuth(m)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
