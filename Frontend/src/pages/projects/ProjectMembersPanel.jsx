import { ROLE_LABELS } from "../members/membersConstants";
import MemberAvatar from "../members/MemberAvatar";

function ProjectMembersPanel({
  members,
  currentUserId,
  canManage,
  canRemoveMember,
  roleBusyId,
  onRoleChange,
  onRequestRemove,
}) {
  const adminCount = members.filter(
    (m) => m.role === "admin" || m.role === "project-admin"
  ).length;

  return (
    <aside className="project-panel project-members-panel">
      <div className="project-panel-head">
        <h2>
          Members <span className="project-panel-count">{members.length}</span>
        </h2>
      </div>

      <p className="project-panel-sub">
        {adminCount} Project Admin{adminCount === 1 ? "" : "s"} ·{" "}
        {members.length - adminCount} Member
        {members.length - adminCount === 1 ? "" : "s"}
      </p>

      {members.length === 0 ? (
        <p className="project-panel-empty">No members yet.</p>
      ) : (
        <ul className="pd-member-list">
          {members.map((member) => {
            const isSelf = member.user?._id === currentUserId;
            // Legacy "admin" memberships are shown as a badge only — the UI
            // never offers "Admin" as an assignable project role.
            const showRoleSelect =
              canManage && !isSelf && member.role !== "admin";
            const showRemove = canRemoveMember?.(member) === true;

            return (
              <li key={member.user?._id} className="pd-member-item">
                <MemberAvatar
                  user={member.user}
                  className="member-avatar-sm"
                />

                <div className="pd-member-identity">
                  <span className="pd-member-name">
                    {member.user?.fullName || "Unknown"}
                    {isSelf ? " (you)" : ""}
                  </span>
                  <span className="pd-member-username">
                    @{member.user?.username || "unknown"}
                  </span>
                  <span className="pd-member-email">
                    {member.user?.email || "—"}
                  </span>
                </div>

                <div className="pd-member-side">
                  {showRoleSelect ? (
                    <select
                      className="pd-role-select"
                      value={member.role}
                      disabled={roleBusyId === member.user?._id}
                      onChange={(e) => onRoleChange(member, e.target.value)}
                      title="Change project role"
                    >
                      <option value="member">Member</option>
                      <option value="project-admin">Project Admin</option>
                    </select>
                  ) : (
                    <span className={`role-badge ${member.role}`}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                  )}

                  {showRemove && (
                    <button
                      type="button"
                      className="pd-remove-btn"
                      disabled={roleBusyId === member.user?._id}
                      onClick={() => onRequestRemove(member)}
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

export default ProjectMembersPanel;