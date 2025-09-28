// This is your existing App.jsx content, renamed to LeetCodeApp
// Copy your current App.jsx content here and rename the component

import { useEffect, useState, useMemo } from 'react'

const API = '/api'

export default function LeetCodeApp() {
  const [problems, setProblems] = useState([])
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('None')
  const [selectedProblemId, setSelectedProblemId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [wake, setWake] = useState(false)
  const [pyodide, setPyodide] = useState(null)
  const [pyodideLoading, setPyodideLoading] = useState(true)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  // Load Pyodide with correct version
  useEffect(() => {
    async function initPyodide() {
      try {
        setPyodideLoading(true)
        // Dynamically load Pyodide from CDN
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js'
        script.async = true
        
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })

        // Wait for loadPyodide to be available
        const loadPyodide = window.loadPyodide
        if (!loadPyodide) {
          throw new Error('loadPyodide not found')
        }

        const py = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
        })
        
        setPyodide(py)
        console.log('Pyodide loaded successfully')
      } catch (e) {
        console.error('Failed to load Pyodide:', e)
        setError('Failed to load Python runtime. Please refresh the page.')
      } finally {
        setPyodideLoading(false)
      }
    }
    
    initPyodide()
    
    // Cleanup
    return () => {
      const script = document.querySelector('script[src*="pyodide.js"]')
      if (script) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Fetch all problems
  useEffect(() => {
    const url = new URL(API + '/problems', location.origin)
    fetch(url).then(r => r.json()).then(setProblems).catch(console.error)
  }, [])

  // Update code when result changes
  useEffect(() => {
    if (result?.solutionCode) {
      setCode(result.solutionCode)
      setOutput('')
      setError('')
    }
  }, [result])

  // Difficulty mapping for sorting
  const difficultyMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3 }

  // Filter and sort problems
  const filteredAndSortedProblems = useMemo(() => {
    let filtered = problems
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(lowerSearch) || 
        p.difficulty.toLowerCase().includes(lowerSearch)
      )
    }
    if (difficultyFilter !== 'All') {
      filtered = filtered.filter(p => p.difficulty === difficultyFilter)
    }

    if (sortOrder !== 'None') {
      filtered = [...filtered].sort((a, b) => {
        const diffA = difficultyMap[a.difficulty] || 0
        const diffB = difficultyMap[b.difficulty] || 0
        return sortOrder === 'Asc' ? diffA - diffB : diffB - diffA
      })
    }

    return filtered
  }, [problems, search, difficultyFilter, sortOrder])

  // Get badge style based on difficulty
  const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return { background: '#6ea8fe', color: 'white' }
      case 'Medium': return { background: '#f59e0b', color: 'white' }
      case 'Hard': return { background: '#ef4444', color: 'white' }
      default: return { background: '#2a3f68', color: '#cfe1ff' }
    }
  }

  // Get company badge
  const getCompanyBadge = (company) => {
    const map = { 'Google': 'G', 'Apple': 'A', 'Oracle': 'O', 'Meta': 'M' }
    return map[company] ? map[company] : null
  }

  // Handle solving a problem
  async function solve(problemId) {
    setLoading(true)
    setWake(true)
    setSelectedProblemId(problemId)
    try {
      const body = { problemId: Number(problemId), language: 'python' }
      const res = await fetch(API + '/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({
        explanation: 'Request failed. Is the server awake?',
        solutionCode: '',
        timeComplexity: '',
        spaceComplexity: '',
        bigOExplainer: ''
      })
    } finally {
      setLoading(false)
      setTimeout(() => setWake(false), 2500)
    }
  }

  // Run the code with improved error handling
  async function runCode() {
    console.log('Run button clicked')
    
    if (!pyodide) {
      setError('Python runtime not loaded yet. Please wait...')
      return
    }
    
    if (!code || code.trim() === '') {
      setError('No code to run. Please enter some Python code.')
      return
    }
    
    setOutput('')
    setError('')
    setOutput('Running code...')
    
    try {
      // Setup Python environment to capture output
      pyodide.runPython(`
import sys
from io import StringIO

# Create StringIO objects to capture output
sys.stdout = StringIO()
sys.stderr = StringIO()
      `)
      
      // Run the user's code
      try {
        const result = await pyodide.runPythonAsync(code)
        console.log('Code executed successfully', result)
      } catch (pythonError) {
        // Capture Python execution errors
        const errorMsg = pythonError.message || pythonError.toString()
        setError(`Python Error: ${errorMsg}`)
        console.error('Python error:', pythonError)
        return
      }
      
      // Get captured output
      const stdout = pyodide.runPython("sys.stdout.getvalue()")
      const stderr = pyodide.runPython("sys.stderr.getvalue()")
      
      console.log('stdout:', stdout, 'stderr:', stderr)
      
      if (stdout) {
        setOutput(stdout)
      } else if (!stderr) {
        // If there's no output at all, show that the code ran successfully
        setOutput('Code executed successfully (no output)')
      }
      
      if (stderr) {
        setError(stderr)
      }
      
      // Reset stdout/stderr for next run
      pyodide.runPython(`
sys.stdout = StringIO()
sys.stderr = StringIO()
      `)
      
    } catch (e) {
      console.error('Execution error:', e)
      setError(`Execution Error: ${e.message || e.toString()}`)
    }
  }

  const selectedProblem = useMemo(() => 
    problems.find(p => String(p.id) === String(selectedProblemId)), 
    [problems, selectedProblemId]
  )

  return (
    <div className="container" style={{ display: 'flex', minHeight: '100vh', width: '100vw', margin: 0, padding: 0 }}>
      <div style={{ flex: 1, padding: '12px' }}>
        <div className="title">LeetCode Problems</div>
        {wake && <div className="muted" style={{ marginTop: 8 }}>Warming server... (Render free tier cold start)</div>}
        {pyodideLoading && <div className="muted" style={{ marginTop: 8 }}>Loading Python runtime...</div>}

        <div className="card" style={{ marginTop: 12 }}>
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="output"
          />
        </div>

        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <select 
            value={difficultyFilter} 
            onChange={e => setDifficultyFilter(e.target.value)}
            style={{ padding: '8px', borderRadius: '10px', background: '#1b2942', color: '#cfe1ff', border: 'none' }}
          >
            <option>All</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select 
            value={sortOrder} 
            onChange={e => setSortOrder(e.target.value)}
            style={{ padding: '8px', borderRadius: '10px', background: '#1b2942', color: '#cfe1ff', border: 'none' }}
          >
            <option>None</option>
            <option>Asc</option>
            <option>Desc</option>
          </select>
        </div>

        <div style={{ marginTop: 12, maxHeight: '60vh', overflowY: 'auto' }}>
          {filteredAndSortedProblems.length === 0 ? (
            <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>No problems found</div>
          ) : (
            filteredAndSortedProblems.map(p => {
              const companyBadges = p.companies?.filter(c => ['Google', 'Apple', 'Oracle', 'Meta'].includes(c)).map(getCompanyBadge) || []
              return (
                <div
                  key={p.id}
                  className="card row"
                  style={{ 
                    padding: '12px', 
                    marginBottom: '8px', 
                    cursor: 'pointer', 
                    background: selectedProblemId === p.id ? '#1b2942' : '' 
                  }}
                  onClick={() => solve(p.id)}
                >
                  <span style={{ flex: 1 }}>{p.id}. {p.title}</span>
                  <span className="badge" style={getDifficultyStyle(p.difficulty)}>{p.difficulty}</span>
                  {companyBadges.map(badge => (
                    <span key={badge} className="badge" style={{ background: '#2a3f68', color: '#cfe1ff', marginLeft: '4px' }}>
                      {badge}
                    </span>
                  ))}
                </div>
              )
            })
          )}
        </div>

        <div className="muted" style={{ marginTop: '24px', fontSize: '14px' }}>
          <strong>Company Indicators:</strong> G = Google, A = Apple, O = Oracle, M = Meta
        </div>
      </div>

      {selectedProblemId && (
        <div
          className="card"
          style={{
            flex: 1,
            padding: '16px',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            background: '#111a2b',
            boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
            transform: selectedProblemId ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          <button
            onClick={() => { setSelectedProblemId(null); setResult(null); setOutput(''); setError(''); }}
            style={{ background: '#6ea8fe', color: '#081225', border: '0', padding: '8px 12px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', position: 'absolute', top: '8px', right: '8px' }}
          >
            Close
          </button>
          <div className="panel-title">{selectedProblem?.title}</div>
          {selectedProblem?.description && (
            <div className="card" style={{ marginTop: '12px' }}>
              <div className="panel-title">Problem Description</div>
              <div className="output">{selectedProblem.description}</div>
            </div>
          )}
          {selectedProblem && (
            <div style={{ marginTop: '8px' }}>
              <a href={selectedProblem.leetcode_url} target="_blank" rel="noreferrer">
                Open on LeetCode
              </a>
            </div>
          )}
          {loading && <div className="muted" style={{ marginTop: '12px' }}>Solving...</div>}
          {result && !loading && (
            <>
              <div className="card" style={{ marginTop: '12px' }}>
                <div className="panel-title">Solution Code</div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  style={{ 
                    width: '100%', 
                    minHeight: '200px', 
                    background: '#1b2942', 
                    color: '#cfe1ff', 
                    border: 'none', 
                    padding: '8px', 
                    borderRadius: '10px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={runCode}
                  style={{ 
                    background: pyodide ? '#6ea8fe' : '#4a5568', 
                    color: '#081225', 
                    border: '0', 
                    padding: '8px 12px', 
                    borderRadius: '10px', 
                    fontWeight: '600', 
                    cursor: pyodide ? 'pointer' : 'not-allowed', 
                    marginTop: '8px',
                    opacity: pyodide ? 1 : 0.6
                  }}
                  disabled={!pyodide}
                >
                  {pyodideLoading ? 'Loading Python...' : 'Run Code'}
                </button>
              </div>
              <div className="card" style={{ marginTop: '12px' }}>
                <div className="panel-title">Output</div>
                {output ? (
                  <pre className="output" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{output}</pre>
                ) : error ? (
                  <div style={{ color: '#ef4444', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{error}</div>
                ) : (
                  <div className="muted" style={{ padding: '8px' }}>Output will appear here when you run the code...</div>
                )}
              </div>
              <div className="card" style={{ marginTop: '12px' }}>
                <div className="panel-title">Approach</div>
                <div className="output">{result.explanation || ''}</div>
              </div>
              <div className="card" style={{ marginTop: '12px' }}>
                <div className="panel-title">Big-O (Time)</div>
                <div className="output">{result.timeComplexity || ''}</div>
              </div>
              <div className="card" style={{ marginTop: '12px' }}>
                <div className="panel-title">Big-O (Space)</div>
                <div className="output">{result.spaceComplexity || ''}</div>
              </div>
              <div className="card" style={{ marginTop: '12px' }}>
                <div className="panel-title">Big-O Explainer</div>
                <div className="output">{result.bigOExplainer || ''}</div>
              </div>
            </>
          )}
        </div>
      )}
      {selectedProblemId && <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => { setSelectedProblemId(null); setResult(null); setOutput(''); setError(''); }} />}
    </div>
  )
}