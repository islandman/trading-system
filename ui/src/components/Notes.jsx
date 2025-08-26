import React, { useState, useEffect } from 'react'

function Notes() {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [filterCategory, setFilterCategory] = useState('all')

  const categories = [
    { value: 'general', label: 'General', color: 'var(--accent-primary)' },
    { value: 'analysis', label: 'Analysis', color: 'var(--accent-success)' },
    { value: 'strategy', label: 'Strategy', color: 'var(--accent-warning)' },
    { value: 'lessons', label: 'Lessons', color: 'var(--accent-danger)' },
    { value: 'ideas', label: 'Ideas', color: 'var(--accent-primary)' }
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
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-primary)' }}>Add New Note</h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
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
                backgroundColor: 'var(--accent-primary)',
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
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              resize: 'vertical',
              fontFamily: 'inherit',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
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
            backgroundColor: filterCategory === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: filterCategory === 'all' ? 'white' : 'var(--text-primary)',
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
              backgroundColor: filterCategory === cat.value ? cat.color : 'var(--bg-tertiary)',
              color: filterCategory === cat.value ? 'white' : 'var(--text-primary)',
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
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '2px dashed var(--border-color)'
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
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
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
                      backgroundColor: 'var(--accent-danger)',
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
