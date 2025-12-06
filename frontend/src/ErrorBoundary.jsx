import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo,
      error
    });
    console.error('Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ 
            maxWidth: '600px', 
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>
              ⚠️ Ha ocurrido un error en la aplicación
            </h2>
            <p style={{ marginBottom: '24px', color: '#4b5563' }}>
              No te preocupes, esto no afecta tus datos. Por favor, reinicia la página o intenta más tarde.
            </p>
            <details style={{ 
              backgroundColor: '#f1f5f9', 
              padding: '16px', 
              borderRadius: '8px',
              textAlign: 'left',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}>
                Ver detalles técnicos
              </summary>
              <pre style={{ 
                marginTop: '12px', 
                overflow: 'auto',
                maxHeight: '200px',
                color: '#dc2626',
                textAlign: 'left',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error && this.state.error.toString()}
                <br /><br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #667eea)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(124, 58, 237, 0.3)'
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              Reiniciar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}