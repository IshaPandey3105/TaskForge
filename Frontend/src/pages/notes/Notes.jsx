import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import formatDate from "../../utils/formatDate";
import "../../layoutes/Notes.css";

import NotesToolbar from "./NotesToolbar";
import NoteCard from "./NoteCard";
import NoteModal from "./NoteModal";
import NoteDetails from "./NoteDetails";
import NoteDeleteModal from "./NoteDeleteModal";

function Notes() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [rolesByProject, setRolesByProject] = useState({});
  const [notesByProject, setNotesByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters / view
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");

  // Create / Edit modal
  const [noteModal, setNoteModal] = useState(null); // { mode, projectId, note }
  const [form, setForm] = useState({ projectId: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Details modal
  const [detailModal, setDetailModal] = useState(null); // { note }

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(null); // { note }
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const projectsRes = await api.get("/projects");
      const projectList = projectsRes.data.data || [];
      setProjects(projectList);

      const notePromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/notes/${project._id}`);
          return { projectId: project._id, notes: res.data.data || [] };
        } catch {
          return { projectId: project._id, notes: [] };
        }
      });

      const rolePromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/projects/${project._id}/members`);
          const members = res.data.data || [];
          const current = members.find((m) => m.user?._id === user?._id);
          return { projectId: project._id, role: current?.role || "member" };
        } catch {
          return { projectId: project._id, role: "member" };
        }
      });

      const [noteResults, roleResults] = await Promise.all([
        Promise.all(notePromises),
        Promise.all(rolePromises),
      ]);

      const notesMap = {};
      noteResults.forEach((r) => {
        notesMap[r.projectId] = r.notes;
      });

      const rolesMap = {};
      roleResults.forEach((r) => {
        rolesMap[r.projectId] = r.role;
      });

      setNotesByProject(notesMap);
      setRolesByProject(rolesMap);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load notes.");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, [loadData]);

  // ---- Derived data ----

  const allNotes = useMemo(() => {
    const list = [];
    Object.entries(notesByProject).forEach(([projectId, notes]) => {
      const project = projects.find((p) => p._id === projectId);
      notes.forEach((note) => {
        list.push({ ...note, project });
      });
    });
    return list;
  }, [notesByProject, projects]);

  const filteredNotes = useMemo(() => {
    let list = [...allNotes];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((n) => n.content?.toLowerCase().includes(q));
    }

    if (projectFilter !== "all") {
      list = list.filter((n) => n.project?._id === projectFilter);
    }

    if (sortBy === "recent") {
      list.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    return list;
  }, [allNotes, search, projectFilter, sortBy]);

  // ---- Permissions (existing architecture) ----
  // Create: any project member — the backend route uses
  // validateProjectPermission(AvailableUserRoles), so MEMBER, PROJECT_ADMIN
  // and ADMIN memberships may all create notes in their own projects.
  //
  // Edit/Delete: strictly the user's PROJECT MEMBERSHIP role must be
  // admin or project-admin, exactly matching validateProjectPermission
  // ([ADMIN, PROJECT_ADMIN]) on those routes. The global user.role is NOT
  // used for project-level decisions — a global admin whose membership
  // role is "member" gets no edit/delete actions, same as the backend.

  const canManageProject = useCallback(
    (projectId) => {
      const role = rolesByProject[projectId];
      return role === "admin" || role === "project-admin";
    },
    [rolesByProject]
  );

  const canCreateNotes = projects.length > 0;

  // ---- Modals ----

  const openCreate = () => {
    const defaultProject =
      projectFilter !== "all" ? projectFilter : projects[0]?._id || "";

    setForm({ projectId: defaultProject, content: "" });
    setModalError("");
    setNoteModal({ mode: "create", projectId: defaultProject, note: null });
  };

  const openEdit = (note) => {
    setForm({ projectId: note.project?._id || "", content: note.content || "" });
    setModalError("");
    setNoteModal({ mode: "edit", projectId: note.project?._id, note });
  };

  const openDetails = (note) => {
    setDetailModal({ note });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteModal) return;

    const { mode, note } = noteModal;

    if (mode === "create" && !form.projectId) {
      setModalError("Please select a project.");
      return;
    }

    if (!form.content.trim()) {
      setModalError("Note content is required.");
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      if (mode === "create") {
        await api.post(`/notes/${form.projectId}`, {
          content: form.content.trim(),
        });
      } else {
        await api.put(`/notes/${note.project._id}/n/${note._id}`, {
          content: form.content.trim(),
        });
      }

      setNoteModal(null);
      await loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Unable to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal?.note) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await api.delete(
        `/notes/${deleteModal.note.project._id}/n/${deleteModal.note._id}`
      );
      setDeleteModal(null);
      await loadData();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Unable to delete note.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="notes-page">Loading notes...</div>;
  }

  if (error && projects.length === 0) {
    return (
      <div className="notes-page">
        <h1>Notes</h1>
        <p className="notes-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="notes-page">
      {/* Header */}
      <div className="notes-header">
        <div>
          <h1>Notes</h1>
          <p>Project notes and shared knowledge across your workspace.</p>
        </div>

        <button
          type="button"
          className="notes-create-btn"
          onClick={openCreate}
          disabled={!canCreateNotes}
          title={
            !canCreateNotes
              ? "Join a project to create notes"
              : undefined
          }
        >
          + New Note
        </button>
      </div>

      {/* Toolbar */}
      <NotesToolbar
        search={search}
        onSearchChange={setSearch}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        projects={projects}
      />

      {/* Content */}
      {projects.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-icon">▤</div>
          <h2>No projects yet</h2>
          <p>
            You need to be a member of a project before you can create notes.
            Join or create a project to start writing and sharing notes with
            your team.
          </p>
          <button
            type="button"
            className="notes-empty-action"
            onClick={() => navigate("/projects")}
          >
            View Projects
          </button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="notes-empty">
          <p>
            {allNotes.length === 0
              ? "No notes yet. Create your first note."
              : "No notes match your filters."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="notes-grid">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              canManage={canManageProject(note.project?._id)}
              onOpenDetails={openDetails}
              onEdit={openEdit}
              onRequestDelete={(n) => {
                setDeleteError("");
                setDeleteModal({ note: n });
              }}
            />
          ))}
        </div>
      ) : (
        <div className="notes-list">
          <table>
            <thead>
              <tr>
                <th>Note</th>
                <th>Project</th>
                <th>Created By</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note) => (
                <tr
                  key={note._id}
                  className="clickable-row"
                  onClick={() => openDetails(note)}
                >
                  <td className="notes-list-content">
                    {note.content?.length > 80
                      ? `${note.content.slice(0, 80)}...`
                      : note.content}
                  </td>
                  <td>{note.project?.name || "—"}</td>
                  <td>
                    {note.createdBy?.fullName ||
                      note.createdBy?.username ||
                      "—"}
                  </td>
                  <td>{formatDate(note.createdAt)}</td>
                  <td>{formatDate(note.updatedAt)}</td>
                  {canManageProject(note.project?._id) && (
                    <td
                      className="notes-list-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(note);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteError("");
                          setDeleteModal({ note });
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      <NoteModal
        modal={noteModal}
        form={form}
        onFormChange={setForm}
        error={modalError}
        saving={saving}
        onClose={() => setNoteModal(null)}
        onSubmit={handleSubmit}
        projects={projects}
      />

      {/* Details modal */}
      <NoteDetails
        modal={detailModal}
        canManage={
          detailModal ? canManageProject(detailModal.note.project?._id) : false
        }
        onClose={() => setDetailModal(null)}
        onEdit={(note) => {
          setDetailModal(null);
          openEdit(note);
        }}
      />

      {/* Delete confirmation modal */}
      <NoteDeleteModal
        modal={deleteModal}
        deleting={deleting}
        error={deleteError}
        onClose={() => setDeleteModal(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default Notes;