import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import formatDate from "../../utils/formatDate";
import "../../layoutes/Members.css";

import { ROLE_LABELS } from "./membersConstants";
import MemberAvatar from "./MemberAvatar";
import MemberToolbar from "./MemberToolbar";
import MemberCard from "./MemberCard";
import MemberDirectory from "./MemberDirectory";
import TeamOverview from "./TeamOverview";
import MemberDetails from "./MemberDetails";
import MemberAddModal from "./MemberAddModal";

function Members() {
  const user = useAuthStore((state) => state.user);

  const [projects, setProjects] = useState([]);
  const [rolesByProject, setRolesByProject] = useState({});
  const [membershipsByProject, setMembershipsByProject] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters / view
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // Details modal
  const [detailModal, setDetailModal] = useState(null); // { member }

  // Directory: project context used for membership status + quick add/remove
  const [dirProjectId, setDirProjectId] = useState("");

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

  // Remove member confirmation
  const [removeTarget, setRemoveTarget] = useState(null); // { member, projectId }
  const [removing, setRemoving] = useState(false);

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

      // Real registered-user list for the selection directory. If this
      // endpoint is unavailable we gracefully fall back to membership data.
      try {
        const usersRes = await api.get("/users");
        setAllUsers(usersRes.data.data || []);
      } catch {
        setAllUsers([]);
      }
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
  // projects the current user belongs to. This drives the main grid/list
  // and the Team Overview stats (actual project members only).
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

  // Full people directory built from ALL registered users (GET /users),
  // merged with any known memberships. Falls back to the membership-derived
  // directory when the users endpoint is unavailable.
  const allUsersDirectory = useMemo(() => {
    const source =
      allUsers.length > 0
        ? allUsers.map((u) => ({ user: u }))
        : directory.map((d) => ({ user: d.user }));

    return source
      .map(({ user: u }) => {
        const memberships = [];
        Object.entries(membershipsByProject).forEach(([projectId, members]) => {
          const project = projects.find((p) => p._id === projectId);
          const membership = members.find((m) => m.user?._id === u?._id);
          if (membership && project) {
            memberships.push({
              projectId,
              projectName: project.name,
              role: membership.role,
              joinedAt: membership.createdAt,
            });
          }
        });

        const roles = memberships.map((m) => m.role);
        const highestRole = roles.includes("admin")
          ? "admin"
          : roles.includes("project-admin")
            ? "project-admin"
            : "member";

        const joinedDates = memberships
          .map((m) => m.joinedAt)
          .filter(Boolean)
          .sort((a, b) => new Date(a) - new Date(b));

        return {
          user: u,
          memberships,
          highestRole,
          joinedAt: joinedDates[0] || null,
          projectCount: memberships.length,
        };
      })
      .sort((a, b) =>
        (a.user?.fullName || "").localeCompare(b.user?.fullName || "")
      );
  }, [allUsers, directory, membershipsByProject, projects]);

  // Map of global role per user id, used so the UI never offers (or allows)
  // removing a Global Admin as a project member. The backend also blocks it.
  const globalRoleByUserId = useMemo(() => {
    const map = {};
    allUsers.forEach((u) => {
      if (u?._id) map[u._id] = u.role;
    });
    return map;
  }, [allUsers]);

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
  // Add/Remove use POST & DELETE /projects/:projectId/members which the
  // backend restricts to ADMIN / PROJECT_ADMIN via validateProjectPermission.
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

  // Default the directory project selector to the first manageable project
  useEffect(() => {
    if (!dirProjectId && manageableProjects.length > 0) {
      setDirProjectId(manageableProjects[0]._id);
    }
  }, [dirProjectId, manageableProjects]);

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

  // Quick-add straight from the member directory: prefill the email of the
  // selected person and the currently chosen manageable project.
  const handleQuickAdd = (member) => {
    if (!dirProjectId) return;

    setAddForm({
      projectId: dirProjectId,
      email: member.user?.email || "",
      role: "member",
    });
    setAddError("");
    setAddSuccess("");
    setAddModalOpen(true);
  };

  const handleRemoveRequest = (member) => {
    if (!dirProjectId) return;
    setRemoveTarget({ member, projectId: dirProjectId });
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;

    setRemoving(true);

    try {
      await api.delete(
        `/projects/${removeTarget.projectId}/members/${removeTarget.member.user._id}`
      );

      const projectName =
        projects.find((p) => p._id === removeTarget.projectId)?.name ||
        "project";

      setRemoveTarget(null);
      setAddSuccess(
        `${removeTarget.member.user?.fullName || "Member"} removed from ${projectName}.`
      );
      setTimeout(() => setAddSuccess(""), 4000);
      await loadData();
    } catch (err) {
      setRemoveTarget(null);
      setError(err.response?.data?.message || "Unable to remove member.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setRemoving(false);
    }
  };

  // Whether the current user is allowed to remove this member from the
  // currently selected project. Only Admin / Project Admin may remove; a
  // Project Admin can never remove a Global Admin; Members remove nothing.
  const canRemoveMember = (member) => {
    if (!dirProjectId) return false;
    if (!canManageProject(dirProjectId)) return false;
    if (member.user?._id === user?._id) return false;
    if (globalRoleByUserId[member.user?._id] === "admin") return false;
    // The person must actually be assigned to the selected project.
    return (membershipsByProject[dirProjectId] || []).some(
      (m) => m.user?._id === member.user?._id
    );
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

  if (loading) {
    return <div className="members-page">Loading members...</div>;
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
      {!addSuccess && error && <div className="members-error">{error}</div>}

      <div className="members-layout">
        {/* Member directory (left panel) */}
        <MemberDirectory
          members={allUsersDirectory}
          manageableProjects={manageableProjects}
          selectedProjectId={dirProjectId}
          onSelectProject={setDirProjectId}
          membershipsByProject={membershipsByProject}
          canManage={manageableProjects.length > 0}
          onOpenDetails={openDetails}
          onQuickAdd={handleQuickAdd}
        />

        {/* Main directory */}
        <div className="members-main">
          {/* Toolbar */}
          <MemberToolbar
            search={search}
            onSearchChange={setSearch}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            projectFilter={projectFilter}
            onProjectFilterChange={setProjectFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            projects={projects}
          />

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
                <MemberCard
                  key={member.user?._id}
                  member={member}
                  onOpenDetails={openDetails}
                  onRemove={canRemoveMember(member) ? handleRemoveRequest : null}
                />
              ))}
            </div>
          ) : (
            <div className="members-list">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
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
                          <MemberAvatar user={member.user} className="member-avatar-sm" />
                          <div className="members-list-identity">
                            <span>{member.user?.fullName || "Unknown"}</span>
                            <span>@{member.user?.username || "unknown"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="members-list-email">
                        {member.user?.email || "—"}
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
        <TeamOverview stats={stats} />
      </div>

      {/* Details modal */}
      <MemberDetails
        modal={detailModal}
        onClose={() => setDetailModal(null)}
      />

      {/* Add Member modal */}
      <MemberAddModal
        open={addModalOpen}
        form={addForm}
        onFormChange={setAddForm}
        error={addError}
        adding={adding}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddMember}
        manageableProjects={manageableProjects}
      />

      {/* Remove member confirmation */}
      {removeTarget && (
        <div
          className="modal-overlay"
          onClick={() => !removing && setRemoveTarget(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove from Project?</h3>
            <p className="modal-text">
              This will remove "{removeTarget.member.user?.fullName ||
                removeTarget.member.user?.username}" (@
              {removeTarget.member.user?.username || "unknown"}) from "
              {projects.find((p) => p._id === removeTarget.projectId)?.name ||
                "this project"}
              ". They will lose access to it.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                disabled={removing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-danger"
                onClick={handleRemoveMember}
                disabled={removing}
              >
                {removing ? "Removing..." : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;