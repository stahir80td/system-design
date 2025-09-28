import { useState, useMemo, useEffect } from 'react'
import { systemDesignQuestions, categories, difficulties } from './data/system-design/index.js'
import { loadQuestion } from './utils/systemDesignLoader.js'

export default function SystemDesignApp() {
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('None')
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  const [selectedQuestionData, setSelectedQuestionData] = useState(null)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [expandedSection, setExpandedSection] = useState('talkingPoints')

  // Load question data when selected
  useEffect(() => {
    if (selectedQuestionId) {
      setLoadingQuestion(true)
      loadQuestion(selectedQuestionId)
        .then(data => {
          setSelectedQuestionData(data)
          setLoadingQuestion(false)
        })
        .catch(error => {
          console.error('Failed to load question:', error)
          setLoadingQuestion(false)
          // For demo, use placeholder data if file doesn't exist
          setSelectedQuestionData({
            id: selectedQuestionId,
            title: systemDesignQuestions.find(q => q.id === selectedQuestionId)?.title,
            description: 'Full content coming soon. This is a placeholder for the detailed system design question.',
            talkingPoints: {
              introduction: 'This question is being prepared with detailed content...'
            }
          })
        })
    } else {
      setSelectedQuestionData(null)
    }
  }, [selectedQuestionId])

  // Difficulty mapping for sorting
  const difficultyMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3 }

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    let filtered = systemDesignQuestions
    
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(lowerSearch) ||
        q.category.toLowerCase().includes(lowerSearch) ||
        q.companies.some(c => c.toLowerCase().includes(lowerSearch))
      )
    }
    
    if (difficultyFilter !== 'All') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter)
    }
    
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(q => q.category === categoryFilter)
    }
    
    if (sortOrder !== 'None') {
      filtered = [...filtered].sort((a, b) => {
        const diffA = difficultyMap[a.difficulty] || 0
        const diffB = difficultyMap[b.difficulty] || 0
        return sortOrder === 'Asc' ? diffA - diffB : diffB - diffA
      })
    }
    
    return filtered
  }, [search, difficultyFilter, categoryFilter, sortOrder])

  // Style helpers
  const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return { background: '#10b981', color: 'white' }
      case 'Medium': return { background: '#f59e0b', color: 'white' }
      case 'Hard': return { background: '#ef4444', color: 'white' }
      default: return { background: '#6b7280', color: 'white' }
    }
  }

  const getCategoryStyle = (category) => {
    const colors = {
      'Social Media & Communication': '#3b82f6',
      'Video & Streaming': '#ec4899',
      'Storage & Files': '#06b6d4',
      'E-commerce & Marketplace': '#10b981',
      'Infrastructure & Tools': '#f59e0b',
      'Financial & Payments': '#8b5cf6',
      'Gaming & Real-time': '#ef4444'
    }
    return {
      background: colors[category] || '#6b7280',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px'
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, background: '#0a0f1c', color: '#cfe1ff' }}>
      {/* Left Panel - Questions List */}
      <div style={{ flex: 1, padding: '20px', maxWidth: '600px', borderRight: '1px solid #1b2942' }}>
        <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px' }}>
          System Design Questions
          <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '10px' }}>
            ({filteredQuestions.length} of {systemDesignQuestions.length})
          </span>
        </div>

        <input
          type="text"
          placeholder="Search by title, company, or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            background: '#1b2942',
            border: 'none',
            borderRadius: '8px',
            color: '#cfe1ff',
            fontSize: '14px',
            marginBottom: '12px'
          }}
        />

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <select 
            value={difficultyFilter} 
            onChange={e => setDifficultyFilter(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', background: '#1b2942', color: '#cfe1ff', border: 'none' }}
          >
            {difficulties.map(diff => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>
          
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', background: '#1b2942', color: '#cfe1ff', border: 'none' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select 
            value={sortOrder} 
            onChange={e => setSortOrder(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', background: '#1b2942', color: '#cfe1ff', border: 'none' }}
          >
            <option value="None">Sort</option>
            <option value="Asc">Easy → Hard</option>
            <option value="Desc">Hard → Easy</option>
          </select>
        </div>

        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
          {filteredQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              No questions found
            </div>
          ) : (
            filteredQuestions.map(q => (
              <div
                key={q.id}
                onClick={() => setSelectedQuestionId(q.id)}
                style={{
                  padding: '16px',
                  marginBottom: '12px',
                  background: selectedQuestionId === q.id ? '#1b2942' : '#111a2b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedQuestionId === q.id ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{q.title}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={getCategoryStyle(q.category)}>{q.category}</span>
                    <span style={{ ...getDifficultyStyle(q.difficulty), padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {q.difficulty}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {q.companies.map(company => (
                    <span key={company} style={{ 
                      background: '#2a3f68', 
                      color: '#6ea8fe', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px' 
                    }}>
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Question Details */}
      {selectedQuestionData && (
        <div style={{ flex: 2, padding: '20px', overflowY: 'auto' }}>
          {loadingQuestion ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <div>Loading question details...</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>
                  {selectedQuestionData.title}
                </div>
                <div style={{ color: '#9ca3af', marginBottom: '12px' }}>
                  {selectedQuestionData.description}
                </div>
              </div>

              {/* Section Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid #1b2942', paddingBottom: '8px', flexWrap: 'wrap' }}>
                {['talkingPoints', 'requirements', 'architecture', 'api', 'database', 'tradeoffs', 'resources'].map(section => (
                  <button
                    key={section}
                    onClick={() => setExpandedSection(section)}
                    disabled={!selectedQuestionData[section]}
                    style={{
                      padding: '8px 16px',
                      background: expandedSection === section ? '#3b82f6' : 'transparent',
                      color: expandedSection === section ? 'white' : '#9ca3af',
                      border: 'none',
                      borderRadius: '4px 4px 0 0',
                      cursor: selectedQuestionData[section] ? 'pointer' : 'not-allowed',
                      textTransform: 'capitalize',
                      fontWeight: '500',
                      opacity: selectedQuestionData[section] ? 1 : 0.5
                    }}
                  >
                    {section === 'talkingPoints' ? 'Discussion' : section}
                  </button>
                ))}
              </div>

              {/* Content Sections */}
              {expandedSection === 'talkingPoints' && selectedQuestionData.talkingPoints && (
                <div style={{ background: '#111a2b', padding: '20px', borderRadius: '8px' }}>
                  {Object.entries(selectedQuestionData.talkingPoints).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '24px' }}>
                      <h3 style={{ color: '#3b82f6', marginBottom: '12px', textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {expandedSection === 'requirements' && selectedQuestionData.requirements && (
                <div style={{ background: '#111a2b', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>Functional Requirements</h3>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
                    {selectedQuestionData.requirements.functional?.map((req, idx) => (
                      <li key={idx} style={{ marginBottom: '8px' }}>{req}</li>
                    ))}
                  </ul>
                  
                  <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>Non-Functional Requirements</h3>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                    {selectedQuestionData.requirements.nonFunctional?.map((req, idx) => (
                      <li key={idx} style={{ marginBottom: '8px' }}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {expandedSection === 'architecture' && selectedQuestionData.architecture && (
                <div style={{ background: '#111a2b', padding: '20px', borderRadius: '8px' }}>
                  {selectedQuestionData.architecture.svgPath && (
                    <div style={{ marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '8px' }}>
                      <img 
                        src={selectedQuestionData.architecture.svgPath} 
                        alt="Architecture Diagram"
                        style={{ width: '100%', height: 'auto' }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'block'
                        }}
                      />
                      <div style={{ display: 'none', textAlign: 'center', padding: '40px', color: '#666' }}>
                        Architecture diagram will be available soon
                      </div>
                    </div>
                  )}
                  
                  <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>Key Components</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {selectedQuestionData.architecture.components?.map(component => (
                      <div key={component.name} style={{ background: '#0a0f1c', padding: '12px', borderRadius: '6px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px', color: '#6ea8fe' }}>
                          {component.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                          {component.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expandedSection === 'api' && selectedQuestionData.apiDesign && (
                <div style={{ background: '#111a2b', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>API Design</h3>
                  <pre style={{ 
                    background: '#0a0f1c', 
                    padding: '16px', 
                    borderRadius: '6px',
                    overflowX: 'auto',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {selectedQuestionData.apiDesign}
                  </pre>
                </div>
              )}

              {expandedSection === 'database' && selectedQuestionData.databaseSchema && (
                <div style={{ background: '#111a2b', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>Database Schema</h3>
                  {selectedQuestionData.databaseSchema.sql && (
                    <>
                      <h4 style={{ marginBottom: '12px', color: '#6ea8fe' }}>SQL Schema</h4>
                      <pre style={{ 
                        background: '#0a0f1c', 
                        padding: '16px', 
                        borderRadius: '6px',
                        overflowX: 'auto',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        marginBottom: '20px'
                      }}>
                        {selectedQuestionData.databaseSchema.sql}
                      </pre>
                    </>
                  )}
                  {selectedQuestionData.databaseSchema.nosql && (
                    <>
                      <h4 style={{ marginBottom: '12px', color: '#6ea8fe' }}>NoSQL Schema</h4>
                      <pre style={{ 
                        background: '#0a0f1c', 
                        padding: '16px', 
                        borderRadius: '6px',
                        overflowX: 'auto',
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}>
                        {selectedQuestionData.databaseSchema.nosql}
                      </pre>
                    </>
                  )}
                </div>
              )}

              {expandedSection === 'tradeoffs' && selectedQuestionData.tradeoffs && (
                <div style={{ background: '#111a2b', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>Design Trade-offs</h3>
                  {selectedQuestionData.tradeoffs.map((tradeoff, idx) => (
                    <div key={idx} style={{ marginBottom: '20px', background: '#0a0f1c', padding: '16px', borderRadius: '6px' }}>
                      <h4 style={{ color: '#6ea8fe', marginBottom: '8px' }}>{tradeoff.decision}</h4>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{tradeoff.analysis}</div>
                    </div>
                  ))}
                </div>
              )}

              {expandedSection === 'resources' && selectedQuestionData.resources && (
                <div style={{ background: '#111a2b', padding: '20px', borderRadius: '8px' }}>
                  {selectedQuestionData.resources.videos && (
                    <>
                      <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>Video Resources</h3>
                      <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                        {selectedQuestionData.resources.videos.map((video, idx) => (
                          <a
                            key={idx}
                            href={`https://youtube.com/watch?v=${video.youtubeId}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#0a0f1c',
                              padding: '12px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              color: '#6ea8fe',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{video.title}</span>
                            {video.duration && <span style={{ color: '#9ca3af' }}>{video.duration}</span>}
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {selectedQuestionData.resources.articles && (
                    <>
                      <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>Articles & Blogs</h3>
                      <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                        {selectedQuestionData.resources.articles.map((article, idx) => (
                          <a
                            key={idx}
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#0a0f1c',
                              padding: '12px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              color: '#6ea8fe'
                            }}
                          >
                            {article.title}
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {selectedQuestionData.resources.books && (
                    <>
                      <h3 style={{ marginBottom: '16px', color: '#3b82f6' }}>Books</h3>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {selectedQuestionData.resources.books.map((book, idx) => (
                          <div key={idx} style={{ background: '#0a0f1c', padding: '12px', borderRadius: '6px' }}>
                            <div style={{ fontWeight: '600', color: '#6ea8fe' }}>{book.title}</div>
                            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                              by {book.author} - {book.chapter}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!selectedQuestionData && (
        <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📐</div>
            <div>Select a question to view details</div>
            <div style={{ fontSize: '14px', marginTop: '20px' }}>
              {systemDesignQuestions.length} questions available
            </div>
          </div>
        </div>
      )}
    </div>
  )
}