import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import "./Members.css";

const ROLE_LABELS = {
  admin: "Admin",
  "project-admin": "Project Admin",
  member: "Member",
};

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Members() {
  const user = useAuthStore((state) => state.user);

  const [projects, setProjects] = useState([]);
  const [rolesByProject, setRolesByProject] = useState({});
  const [membershipsByProject, setMembershipsByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters / view
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // Details modal
  const [detailModal, setDetailModal] = useState(null); // { member }

  // Add member modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    projectId: "",
    email: "",
    role: "member",
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const projectsRes = await api.get("/projects");
      const projectList = projectsRes.data.data || [];
      setProjects(projectList);

      const memberPromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/projects/${project._id}/members`);
          const members = res.data.data || [];
          const current = members.find((m) => m.user?._id === user?._id);
          return {
            projectId: project._id,
            role: current?.role || "member",
            members,
          };
        } catch {
          return { projectId: project._id, role: "member", members: [] };
        }
      });

      const memberResults = await Promise.all(memberPromises);

      const rolesMap = {};
      const membershipsMap = {};
      memberResults.forEach((r) => {
        rolesMap[r.projectId] = r.role;
        membershipsMap[r.projectId] = r.members;
      });

      setRolesByProject(rolesMap);
      setMembershipsByProject(membershipsMap);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load members.");
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

  // Build a team directory by aggregating ProjectMember records across all
  // projects the current user belongs to. This is the only member data the
  // existing API exposes (there is no global user-list endpoint).
  const directory = useMemo(() => {
    const map = new Map();

    Object.entries(membershipsByProject).forEach(([projectId, members]) => {
      const project = projects.find((p) => p._id === projectId);
      if (!project) return;

      members.forEach((m) => {
        const uid = m.user?._id;
        if (!uid) return;

        if (!map.has(uid)) {
          map.set(uid, { user: m.user, memberships: [] });
        }

        map.get(uid).memberships.push({
          projectId,
          projectName: project.name,
          role: m.role,
          joinedAt: m.createdAt,
        });
      });
    });

    return Array.from(map.values()).map((entry) => {
      const roles = entry.memberships.map((m) => m.role);
      const highestRole = roles.includes("admin")
        ? "admin"
        : roles.includes("project-admin")
          ? "project-admin"
          : "member";

      const joinedDates = entry.memberships
        .map((m) => m.joinedAt)
        .filter(Boolean)
        .sort((a, b) => new Date(a) - new Date(b));

      return {
        ...entry,
        highestRole,
        joinedAt: joinedDates[0] || null,
        projectCount: entry.memberships.length,
      };
    });
  }, [membershipsByProject, projects]);

  const stats = useMemo(() => {
    return {
      total: directory.length,
      admins: directory.filter((m) => m.highestRole === "admin").length,
      projectAdmins: directory.filter(
        (m) => m.highestRole === "project-admin"
      ).length,
      members: directory.filter((m) => m.highestRole === "member").length,
    };
  }, [directory]);

  const filteredMembers = useMemo(() => {
    let list = [...directory];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.user?.fullName?.toLowerCase().includes(q) ||
          m.user?.username?.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "all") {
      list = list.filter((m) => m.highestRole === roleFilter);
    }

    if (projectFilter !== "all") {
      list = list.filter((m) =>
        m.memberships.some((ms) => ms.projectId === projectFilter)
      );
    }

    return list.sort((a, b) =>
      (a.user?.fullName || "").localeCompare(b.user?.fullName || "")
    );
  }, [directory, search, roleFilter, projectFilter]);

  // ---- Permissions (existing architecture) ----
  // Add Member uses POST /projects/:projectId/members which the backend
  // restricts to ADMIN / PROJECT_ADMIN via validateProjectPermission.
  // Gating is strictly by the current user's PROJECT MEMBERSHIP role.

  const canManageProject = useCallback(
    (projectId) => {
      const role = rolesByProject[projectId];
      return role === "admin" || role === "project-admin";
    },
    [rolesByProject]
  );

  const manageableProjects = useMemo(
    () => projects.filter((p) => canManageProject(p._id)),
    [projects, canManageProject]
  );

  // ---- Modals ----

  const openDetails = (member) => {
    setDetailModal({ member });
  };

  const openAddModal = () => {
    setAddForm({
      projectId: manageableProjects[0]?._id || "",
      email: "",
      role: "member",
    });
    setAddError("");
    setAddSuccess("");
    setAddModalOpen(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!addForm.projectId) {
      setAddError("Please select a project.");
      return;
    }

    if (!addForm.email.trim()) {
      setAddError("Please enter the member's email address.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(addForm.email.trim())) {
      setAddError("Please enter a valid email address.");
      return;
    }

    setAdding(true);
    setAddError("");

    try {
      await api.post(`/projects/${addForm.projectId}/members`, {
        email: addForm.email.trim(),
        role: addForm.role,
      });

      const projectName =
        projects.find((p) => p._id === addForm.projectId)?.name || "project";

      setAddModalOpen(false);
      setAddSuccess(`Member added to ${projectName}.`);
      setTimeout(() => setAddSuccess(""), 4000);
      await loadData();
    } catch (err) {
      setAddError(err.response?.data?.message || "Unable to add member.");
    } finally {
      setAdding(false);
    }
  };

  const renderAvatar = (memberUser, className) => {
    const avatarUrl = memberUser?.avatar?.url;
    const showAvatar = avatarUrl && !avatarUrl.includes("placehold.co");

    if (showAvatar) {
      return (
        <img className={className} src={avatarUrl} alt={memberUser?.fullName} />
      );
    }

    return (
      <span className={`${className} fallback`}>
        {getInitials(memberUser?.fullName || memberUser?.username)}
      </span>
    );
  };

  if (loading) {
    return <div className="members-page">Loading members...</div>;
  }

  if (error && projects.length === 0) {
    return (
      <div className="members-page">
        <h1>Members</h1>
        <p className="members-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="members-page">
      {/* Header */}
      <div className="members-header">
        <div>
          <h1>Members</h1>
          <p>
            Teammates across your projects, with their project roles and
            memberships.
          </p>
        </div>

        {manageableProjects.length > 0 && (
          <button type="button" className="members-add-btn" onClick={openAddModal}>
            + Add Member
          </button>
        )}
      </div>

      {addSuccess && <div className="members-success">{addSuccess}</div>}

      <div className="members-layout">
        {/* Main directory */}
        <div className="members-main">
          {/* Toolbar */}
          <div className="members-toolbar">
            <input
              type="text"
              className="members-search"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="members-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="project-admin">Project Admin</option>
              <option value="member">Member</option>
            </select>

            <select
              className="members-filter"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <div className="members-view-toggle">
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
              >
                Grid
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
            </div>
          </div>

          {/* Content */}
          {projects.length === 0 ? (
            <div className="members-empty">
              <div className="members-empty-icon">◉</div>
              <h2>No projects yet</h2>
              <p>
                You need to be a member of a project to see your teammates
                here. Join or create a project to build your team directory.
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="members-empty">
              <p>
                {directory.length === 0
                  ? "No members found in your projects."
                  : "No members match your filters."}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="members-grid">
              {filteredMembers.map((member) => (
                <div
                  key={member.user?._id}
                  className="member-card clickable"
                  onClick={() => openDetails(member)}
                >
                  <div className="member-card-top">
                    {renderAvatar(member.user, "member-avatar")}

                    <div className="member-card-info">
                      <span className="member-card-name">
                        {member.user?.fullName || "Unknown"}
                      </span>
                      <span className="member-card-username">
                        @{member.user?.username || "unknown"}
                      </span>
                    </div>

                    <span className={`role-badge ${member.highestRole}`}>
                      {ROLE_LABELS[member.highestRole]}
                    </span>
                  </div>

                  <div className="member-card-meta">
                    <span>{member.projectCount} project(s)</span>
                    {member.joinedAt && (
                      <span>Joined {formatDate(member.joinedAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="members-list">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Projects</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr
                      key={member.user?._id}
                      className="clickable-row"
                      onClick={() => openDetails(member)}
                    >
                      <td>
                        <div className="members-list-member">
                          {renderAvatar(member.user, "member-avatar-sm")}
                          <div className="members-list-identity">
                            <span>{member.user?.fullName || "Unknown"}</span>
                            <span>@{member.user?.username || "unknown"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${member.highestRole}`}>
                          {ROLE_LABELS[member.highestRole]}
                        </span>
                      </td>
                      <td>{member.projectCount}</td>
                      <td>{formatDate(member.joinedAt)}</td>
                      <td className="members-list-actions">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetails(member);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Team Overview side panel */}
        <aside className="team-overview">
          <h2>Team Overview</h2>
          <p className="team-overview-sub">
            Role distribution across your projects
          </p>

          <div className="overview-total">
            <span className="overview-total-value">{stats.total}</span>
            <span className="overview-total-label">Total Members</span>
          </div>

          {stats.total > 0 && (
            <div className="overview-bar">
              {stats.admins > 0 && (
                <span
                  className="overview-seg admin"
                  style={{ width: `${(stats.admins / stats.total) * 100}%` }}
                />
              )}
              {stats.projectAdmins > 0 && (
                <span
                  className="overview-seg project-admin"
                  style={{
                    width: `${(stats.projectAdmins / stats.total) * 100}%`,
                  }}
                />
              )}
              {stats.members > 0 && (
                <span
                  className="overview-seg member"
                  style={{ width: `${(stats.members / stats.total) * 100}%` }}
                />
              )}
            </div>
          )}

          <div className="overview-pills">
            <span className="overview-pill admin">
              <span className="pill-dot" />
              Admins
              <b>{stats.admins}</b>
            </span>
            <span className="overview-pill project-admin">
              <span className="pill-dot" />
              Project Admins
              <b>{stats.projectAdmins}</b>
            </span>
            <span className="overview-pill member">
              <span className="pill-dot" />
              Members
              <b>{stats.members}</b>
            </span>
          </div>
        </aside>
      </div>

      {/* Details modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="member-detail-header">
              {renderAvatar(detailModal.member.user, "member-detail-avatar")}

              <div className="member-detail-identity">
                <h3>{detailModal.member.user?.fullName || "Unknown"}</h3>
                <span>@{detailModal.member.user?.username || "unknown"}</span>
              </div>
            </div>

            <div className="member-detail-section">
              <span className="member-detail-label">Project Memberships</span>

              <ul className="member-membership-list">
                {detailModal.member.memberships.map((ms) => (
                  <li key={ms.projectId}>
                    <div className="member-membership-info">
                      <span className="member-membership-project">
                        {ms.projectName}
                      </span>
                      <span className="member-membership-date">
                        Joined {formatDate(ms.joinedAt)}
                      </span>
                    </div>
                    <span className={`role-badge ${ms.role}`}>
                      {ROLE_LABELS[ms.role]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="member-detail-note">
              Contact details such as email addresses are not exposed by the
              current API.
            </p>

            <div className="modal-actions">
              <button type="button" onClick={() => setDetailModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member modal */}
      {addModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !adding && setAddModalOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Member</h3>

            <p className="modal-text">
              Add an existing registered user to one of your projects by their
              email address.
            </p>

            {addError && <p className="modal-error">{addError}</p>}

            <form onSubmit={handleAddMember}>
              <label>
                Project
                <select
                  value={addForm.projectId}
                  onChange={(e) =>
                    setAddForm({ ...addForm, projectId: e.target.value })
                  }
                >
                  <option value="">Select project...</option>
                  {manageableProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email: e.target.value })
                  }
                  placeholder="member@example.com"
                />
              </label>

              <label>
                Project Role
                <select
                  value={addForm.role}
                  onChange={(e) =>
                    setAddForm({ ...addForm, role: e.target.value })
                  }
                >
                  <option value="member">Member</option>
                  <option value="project-admin">Project Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  disabled={adding}
                >
                  Cancel
                </button>
                <button type="submit" disabled={adding}>
                  {adding ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;