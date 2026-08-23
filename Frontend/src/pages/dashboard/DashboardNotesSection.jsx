import formatDate from "../../utils/formatDate";

function DashboardNotesSection({
  projects,
  notes,
  selectedProjectId,
  onSelectProject,
  onCreateNote,
  onEditNote,
  onDeleteNote,
}) {
  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <h2>Notes</h2>
      </div>

      {projects.length === 0 ? (
        <div className="dash-empty">
          <p>No projects to attach notes to.</p>
        </div>
      ) : (
        <>
          <div className="dash-create-note">
            <select
              value={selectedProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedProjectId}
              onClick={() => onCreateNote(selectedProjectId)}
            >
              + New Note
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="dash-empty">
              <p>No notes yet.</p>
            </div>
          ) : (
            <ul className="notes-list">
              {notes.slice(0, 5).map((note) => (
                <li key={note._id} className="note-item">
                  <p className="note-content">{note.content}</p>
                  <div className="note-meta">
                    <span>{note.project?.name}</span>
                    <span>
                      {note.createdBy?.fullName ||
                        note.createdBy?.username ||
                        "Unknown"}
                    </span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                  <div className="note-actions">
                    <button type="button" onClick={() => onEditNote(note)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDeleteNote(note)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardNotesSection;