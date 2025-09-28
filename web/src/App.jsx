import { useState } from 'react'
import LeetCodeApp from './LeetCodeApp' // Your existing App.jsx content goes here
import SystemDesignApp from './SystemDesignApp'

export default function App() {
  const [activeView, setActiveView] = useState(null) // null for landing, 'leetcode', or 'systemdesign'

  // Landing page view
  if (activeView === null) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a0f1c 0%, #1b2942 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '1200px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: '700', 
              color: '#cfe1ff',
              marginBottom: '16px'
            }}>
              Tech Interview Prep Assistant
            </h1>
            <p style={{ 
              fontSize: '20px', 
              color: '#9ca3af',
              marginBottom: '8px'
            }}>
              Master coding challenges and system design
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280'
            }}>
              Comprehensive preparation for tech interviews
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {/* LeetCode Problems Card */}
            <div 
              onClick={() => setActiveView('leetcode')}
              style={{
                background: '#111a2b',
                borderRadius: '16px',
                padding: '32px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: '2px solid transparent',
                ':hover': {
                  border: '2px solid #3b82f6',
                  transform: 'translateY(-4px)'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '2px solid #3b82f6'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px solid transparent'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💻</div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#cfe1ff',
                marginBottom: '12px'
              }}>
                LeetCode Problems
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
                Practice coding challenges with AI-powered solutions
              </p>
              <ul style={{ 
                textAlign: 'left', 
                color: '#6b7280',
                listStyle: 'none',
                padding: 0,
                lineHeight: '1.8'
              }}>
                <li>✓ 300 curated problems</li>
                <li>✓ Step-by-step explanations</li>
                <li>✓ Python code execution</li>
                <li>✓ Big-O analysis</li>
                <li>✓ Company-specific questions</li>
              </ul>
            </div>

            {/* System Design Card */}
            <div 
              onClick={() => setActiveView('systemdesign')}
              style={{
                background: '#111a2b',
                borderRadius: '16px',
                padding: '32px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '2px solid #3b82f6'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px solid transparent'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📐</div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#cfe1ff',
                marginBottom: '12px'
              }}>
                System Design
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
                Master large-scale distributed systems
              </p>
              <ul style={{ 
                textAlign: 'left', 
                color: '#6b7280',
                listStyle: 'none',
                padding: 0,
                lineHeight: '1.8'
              }}>
                <li>✓ Top 30 system design questions</li>
                <li>✓ Architecture patterns</li>
                <li>✓ Scale estimations</li>
                <li>✓ API & database design</li>
                <li>✓ Trade-off analysis</li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Your personal assistant!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Navigation bar for when in a specific view
  const NavigationBar = () => (
    <div style={{
      background: '#0a0f1c',
      borderBottom: '1px solid #1b2942',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          onClick={() => setActiveView(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#cfe1ff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
        >
          ← Home
        </button>
        <div style={{ color: '#cfe1ff', fontSize: '18px', fontWeight: '600' }}>
          {activeView === 'leetcode' ? 'LeetCode Problems' : 'System Design'}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveView('leetcode')}
          style={{
            padding: '8px 16px',
            background: activeView === 'leetcode' ? '#3b82f6' : 'transparent',
            color: activeView === 'leetcode' ? 'white' : '#9ca3af',
            border: '1px solid',
            borderColor: activeView === 'leetcode' ? '#3b82f6' : '#1b2942',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Coding
        </button>
        <button
          onClick={() => setActiveView('systemdesign')}
          style={{
            padding: '8px 16px',
            background: activeView === 'systemdesign' ? '#3b82f6' : 'transparent',
            color: activeView === 'systemdesign' ? 'white' : '#9ca3af',
            border: '1px solid',
            borderColor: activeView === 'systemdesign' ? '#3b82f6' : '#1b2942',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          System Design
        </button>
      </div>
    </div>
  )

  // Render the selected view
  if (activeView === 'leetcode') {
    return (
      <div>
        <NavigationBar />
        <LeetCodeApp />
      </div>
    )
  }

  if (activeView === 'systemdesign') {
    return (
      <div>
        <NavigationBar />
        <SystemDesignApp />
      </div>
    )
  }
}