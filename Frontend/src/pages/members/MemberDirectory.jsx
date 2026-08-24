import { useState } from "react";
import { ROLE_LABELS } from "./membersConstants";
import MemberAvatar from "./MemberAvatar";


// Left-side member directory backed by the real registered-user list
// (GET /users). Shows every user — not only people already assigned to a
// project — with name, username, email and, when a manageable project is
// selected, their membership status/role in it. Authorized admins can add
// unassigned users or remove assigned members (with confirmation handled
// by the parent page).


function MemberDirectory({
  members,
  manageableProjects,
  selectedProjectId,
  onSelectProject,
  membershipsByProject,
  canManage,
  onOpenDetails,
  onQuickAdd,
  onRemoveRequest,
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? members.filter(
        (m) =>
          m.user?.fullName?.toLowerCase().includes(q) ||
          m.user?.username?.toLowerCase().includes(q) ||
          m.user?.email?.toLowerCase().includes(q)
      )
    : members;

  const roleInSelectedProject = (member) => {
    if (!selectedProjectId) return null;
    const list = membershipsByProject[selectedProjectId] || [];
    const membership = list.find((x) => x.user?._id === member.user?._id);
    return membership ? membership.role : null;
  };

  return (
    <aside className="members-directory">
      <h2>Member Directory</h2>
      <p className="members-directory-sub">
        All registered users across your workspace
      </p>

      <input
        type="text"
        className="members-directory-search"
        placeholder="Search people..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {manageableProjects.length > 0 && (
        <select
          className="members-directory-project"
          value={selectedProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          title="Pick a project you manage to see membership status"
        >
          {manageableProjects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {filtered.length === 0 ? (
        <p className="members-directory-empty">No people match your search.</p>
      ) : (
        <ul className="members-directory-list">
          {filtered.map((member) => {
            const role = roleInSelectedProject(member);
            const statusLabel = !selectedProjectId
              ? member.projectCount > 0
                ? `${member.projectCount} project${member.projectCount === 1 ? "" : "s"}`
                : "No projects"
              : role
                ? ROLE_LABELS[role] || role
                : "Not a member";
            const statusClass = !selectedProjectId
              ? "neutral"
              : role
                ? role === "member"
                  ? "member"
                  : "admin"
                : "none";

            return (
              <li
                key={member.user?._id}
                className="member-directory-item"
                onClick={() => onOpenDetails(member)}
              >
                <MemberAvatar
                  user={member.user}
                  className="member-avatar-sm"
                />

                <div className="member-directory-info">
                  <span className="member-directory-name">
                    {member.user?.fullName || "Unknown"}
                  </span>
                  <span className="member-directory-username">
                    @{member.user?.username || "unknown"}
                  </span>
                  <span className="member-directory-email">
                    {member.user?.email || "—"}
                  </span>
                </div>

                <div className="member-directory-side">
                  <span className={`directory-status ${statusClass}`}>
                    {statusLabel}
                  </span>

                  {canManage && selectedProjectId && !role && (
                    <button
                      type="button"
                      className="directory-add-btn"
                      title={`Add to ${manageableProjects.find((p) => p._id === selectedProjectId)?.name || "project"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAdd(member);
                      }}
                    >
                      + Add
                    </button>
                  )}

                  {canManage && selectedProjectId && role && (
                    <button
                      type="button"
                      className="directory-remove-btn"
                      title={`Remove from ${manageableProjects.find((p) => p._id === selectedProjectId)?.name || "project"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRequest(member);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

export default MemberDirectory;