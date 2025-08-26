import React, { useState, useEffect } from 'react'

function Notes() {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [filterCategory, setFilterCategory] = useState('all')

  const categories = [
    { value: 'general', label: 'General', color: '#3b82f6' },
    { value: 'analysis', label: 'Analysis', color: '#10b981' },
    { value: 'strategy', label: 'Strategy', color: '#f59e0b' },
    { value: 'lessons', label: 'Lessons', color: '#ef4444' },
    { value: 'ideas', label: 'Ideas', color: '#8b5cf6' }
  ]

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('tradingNotes')
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
  }, [])

  // Save notes to localStorage
  const saveNotes = (updatedNotes) => {
    localStorage.setItem('tradingNotes', JSON.stringify(updatedNotes))
    setNotes(updatedNotes)
  }

  const addNote = () => {
    if (newNote.trim()) {
      const note = {
        id: Date.now(),
        text: newNote.trim(),
        category: selectedCategory,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString()
      }
      saveNotes([note, ...notes])
      setNewNote('')
    }
  }

  const deleteNote = (id) => {
    saveNotes(notes.filter(note => note.id !== id))
  }

  const filteredNotes = filterCategory === 'all' 
    ? notes 
    : notes.filter(note => note.category === filterCategory)

  return (
    <div style={{
      padding: '24px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)'
    }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Trading Notes</h3>
      
      {/* Add Note Section */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Add New Note</h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: newNote.trim() ? 'pointer' : 'not-allowed',
                opacity: newNote.trim() ? 1 : 0.6
              }}
            >
              Add Note
            </button>
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your trading note here..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      {/* Filter Section */}
      <div style={{
        marginBottom: '16px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setFilterCategory('all')}
          style={{
            padding: '6px 12px',
            backgroundColor: filterCategory === 'all' ? '#3b82f6' : '#e2e8f0',
            color: filterCategory === 'all' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            style={{
              padding: '6px 12px',
              backgroundColor: filterCategory === cat.value ? cat.color : '#e2e8f0',
              color: filterCategory === cat.value ? 'white' : '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredNotes.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '2px dashed #d1d5db'
          }}>
            No notes found. Add your first trading note above!
          </div>
        ) : (
          filteredNotes.map(note => {
            const category = categories.find(cat => cat.value === note.category)
            return (
              <div
                key={note.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: category?.color || '#6b7280',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {category?.label || 'General'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {note.date}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {note.text}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Notes
