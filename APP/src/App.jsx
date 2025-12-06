import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App(){
  const [page, setPage] = useState('home'); // 'home' | 'login' | 'register'
  const [user, setUser] = useState(null);

  const openAuth = (mode) => setPage(mode);
  const onLogin = (email) => { setUser({ email }); setPage('home'); };
  const onRegister = (email) => { setUser({ email }); setPage('home'); };

  return (
    <div className="app-root">
      <Navbar onAuthClick={openAuth} user={user} setPage={setPage} />

      <main className="app-main">
        {page === 'home' && <HomePage user={user} />}
        {page === 'login' && <Login onSuccess={onLogin} onSwitchMode={() => setPage('register')} />}
        {page === 'register' && <Register onSuccess={onRegister} onSwitchMode={() => setPage('login')} />}
      </main>
    </div>
  );
}
