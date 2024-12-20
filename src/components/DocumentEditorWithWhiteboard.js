import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Replace with your server URL

const AllInOneEditor = () => {
  const [activeTab, setActiveTab] = useState('word'); // Default to Word-like editor
  const [documentContent, setDocumentContent] = useState('');
  const [spreadsheetData, setSpreadsheetData] = useState([['']]);
  const [error, setError] = useState('');
  const [savedFiles, setSavedFiles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recycleBin, setRecycleBin] = useState([]);
  const [showEditor, setShowEditor] = useState(false); // Manage editor visibility

  // Whiteboard State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);

  const [meetingId, setMeetingId] = useState(''); // State for storing meeting ID
  const [showVideoCallOptions, setShowVideoCallOptions] = useState(false); // Show video call options modal
  const [showJoinCallInput, setShowJoinCallInput] = useState(false); // Show input for joining call

  useEffect(() => {
    socket.on('document-update', (newContent) => {
      setDocumentContent(newContent);
    });

    socket.on('connect_error', () => {
      setError('Failed to connect to the server.');
    });

    return () => {
      socket.off('document-update');
      socket.off('connect_error');
    };
  }, []);

  // Handlers for Text Editor
  const handleTextChange = (e) => {
    const newContent = e.target.value;
    setDocumentContent(newContent);
    socket.emit('document-change', newContent);
  };

  const saveFile = () => {
    const fileName = prompt('Enter a name for the file:');
    if (!fileName) return;

    const newFile = { name: fileName, content: documentContent, type: activeTab };
    setSavedFiles([...savedFiles, newFile]);
    alert('File saved successfully!');
  };

  const deleteFile = (file) => {
    setSavedFiles(savedFiles.filter((f) => f !== file));
    setRecycleBin([...recycleBin, file]);
  };

  const restoreFile = (file) => {
    setRecycleBin(recycleBin.filter((f) => f !== file));
    setSavedFiles([...savedFiles, file]);
  };

  const toggleFavorite = (file) => {
    if (favorites.includes(file)) {
      setFavorites(favorites.filter((f) => f !== file));
    } else {
      setFavorites([...favorites, file]);
    }
  };

  const openFile = (file) => {
    setActiveTab(file.type);
    setDocumentContent(file.content);
    setShowEditor(true);
  };

  // Handlers for Spreadsheet
  const handleCellChange = (row, col, value) => {
    const updatedData = [...spreadsheetData];
    updatedData[row][col] = value;
    setSpreadsheetData(updatedData);
  };

  const addRow = () => {
    setSpreadsheetData([...spreadsheetData, Array(spreadsheetData[0].length).fill('')]);
  };

  const addColumn = () => {
    setSpreadsheetData(spreadsheetData.map((row) => [...row, ''])); 
  };

  const createNew = () => {
    if (activeTab === 'word') {
      setDocumentContent('');
    } else if (activeTab === 'excel') {
      setSpreadsheetData([['']]);
    }
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
  };

  // Handlers for Whiteboard
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    setLastPosition({ x: offsetX, y: offsetY });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    setLastPosition({ x: offsetX, y: offsetY });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'word':
        return (
          <div>
            <textarea
              value={documentContent}
              onChange={handleTextChange}
              rows="10"
              cols="50"
            />
          </div>
        );
      case 'excel':
        return (
          <div>
            <table className="table table-bordered">
              <thead>
                <tr>
                  {spreadsheetData[0].map((_, colIndex) => (
                    <th key={colIndex}>Column {colIndex + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spreadsheetData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex}>
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-primary" onClick={addRow}>Add Row</button>
            <button className="btn btn-primary" onClick={addColumn}>Add Column</button>
          </div>
        );
      case 'whiteboard':
        return (
          <div>
            <h2>Whiteboard</h2>
            <div className="mb-3">
              <button
                className="btn btn-outline-primary me-2"
                onClick={() => setColor('#000000')}
              >
                Black
              </button>
              <button
                className="btn btn-outline-primary me-2"
                onClick={() => setColor('#ff0000')}
              >
                Red
              </button>
              <input
                type="range"
                min="1"
                max="10"
                value={lineWidth}
                onChange={(e) => setLineWidth(e.target.value)}
              />
            </div>
            <canvas
              ref={canvasRef}
              width="800"
              height="600"
              style={{ border: '1px solid #000' }}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={draw}
            ></canvas>
          </div>
        );
      default:
        return null;
    }
  };

  const renderList = () => {
    const renderFileCard = (file, actions) => (
      <div className="card m-2" style={{ width: '200px' }}>
        <div className="card-body">
          <h5 className="card-title">{file.name}</h5>
          <p className="card-text">{file.type}</p>
          <div>{actions}</div>
        </div>
      </div>
    );

    if (activeTab === 'savedFiles') {
      return (
        <div>
          <h2>Saved Files</h2>
          <div className="d-flex flex-wrap">
            {savedFiles.map((file, index) =>
              renderFileCard(file, (
                <>
                  <button className="btn btn-warning me-1" onClick={() => toggleFavorite(file)}>
                    {favorites.includes(file) ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button className="btn btn-primary me-1" onClick={() => openFile(file)}>
                    Open
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteFile(file)}>
                    Delete
                  </button>
                </>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'recycleBin') {
      return (
        <div>
          <h2>Recycle Bin</h2>
          <div className="d-flex flex-wrap">
            {recycleBin.map((file, index) =>
              renderFileCard(file, (
                <button className="btn btn-success" onClick={() => restoreFile(file)}>
                  Restore
                </button>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'favorites') {
      return (
        <div>
          <h2>Favorites</h2>
          <div className="d-flex flex-wrap">
            {favorites.map((file, index) =>
              renderFileCard(file, (
                <>
                  <button className="btn btn-warning me-1" onClick={() => toggleFavorite(file)}>
                    Unfavorite
                  </button>
                  <button className="btn btn-primary" onClick={() => openFile(file)}>
                    Open
                  </button>
                </>
              ))
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Handle joining video call
  const joinVideoCall = () => {
    if (meetingId) {
      window.open(`https://meet.google.com/${meetingId}`, '_blank');
    } else {
      alert('Please enter a valid Meeting ID.');
    }
  };

  return (
    <div className="container-fluid d-flex">
      <aside className="d-flex flex-column bg-secondary text-white p-3" style={{ width: '250px' }}>
        <h2>Menu</h2>
        <button className="btn btn-light mb-2" onClick={createNew}>
          Create New
        </button>
        <button className="btn btn-light mb-2" onClick={() => setActiveTab('savedFiles')}>
          Saved Files
        </button>
        <button className="btn btn-light mb-2" onClick={() => setActiveTab('favorites')}>
          Favorites
        </button>
        <button className="btn btn-light mb-2" onClick={() => setActiveTab('recycleBin')}>
          Recycle Bin
        </button>
        <button className="btn btn-light mb-2" onClick={() => setShowVideoCallOptions(true)}>
          Video Call
        </button>
      </aside>
      <div className="flex-grow-1">
        <header className="d-flex align-items-center justify-content-between p-3 bg-primary text-white">
          <h1>All-in-One Editor</h1>
          <nav>
            <button className="btn btn-light me-2" onClick={() => setActiveTab('word')}>
              Word
            </button>
            <button className="btn btn-light me-2" onClick={() => setActiveTab('excel')}>
              Excel
            </button>
            <button className="btn btn-light me-2" onClick={() => setActiveTab('whiteboard')}>
              Whiteboard
            </button>
            <button className="btn btn-success" onClick={saveFile}>
              Save
            </button>
          </nav>
        </header>

        <main className="flex-grow-1 p-4">
          {showEditor && (
            <button className="btn btn-danger float-end" onClick={closeEditor}>
              X
            </button>
          )}
          {renderTabContent()}
          {renderList()}
        </main>
      </div>

      {/* Video Call Options Modal */}
      {showVideoCallOptions && (
        <div className="modal show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Video Call Options</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowVideoCallOptions(false)}
                ></button>
              </div>
              <div className="modal-body">
                <button
                  className="btn btn-primary mb-3"
                  onClick={() => setShowJoinCallInput(true)}
                >
                  Join a Call
                </button>

                {showJoinCallInput && (
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Meeting ID"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                    />
                    <button
                      className="btn btn-success mt-3"
                      onClick={joinVideoCall}
                    >
                      Join Call
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllInOneEditor;

