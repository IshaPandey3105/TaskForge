import formatDate from "../../utils/formatDate";
import { ROLE_LABELS } from "./membersConstants";
import MemberAvatar from "./MemberAvatar";

function MemberCard({ member, currentUserId, onOpenDetails }) {
  const isSelf = member.user?._id === currentUserId;

  return (
    <div
      className="member-card clickable"
      onClick={() => onOpenDetails(member)}
    >
      <div className="member-card-top">
        <MemberAvatar user={member.user} className="member-avatar" />

        <div className="member-card-info">
          <span className="member-card-name">
            {isSelf ? "(you)" : member.user?.fullName || "Unknown"}
          </span>
          <span className="member-card-username">
            @{member.user?.username || "unknown"}
          </span>
          <span className="member-card-email">
            {member.user?.email || "—"}
          </span>
        </div>

        <span className={`role-badge ${member.highestRole}`}>
          {member.highestRole === "admin"
            ? "Project Admin"
            : ROLE_LABELS[member.highestRole]}
        </span>
      </div>

      <div className="member-card-meta">
        <span>{member.projectCount} project(s)</span>
        {member.joinedAt && (
          <span>Joined {formatDate(member.joinedAt)}</span>
        )}
      </div>
    </div>
  );
}

export default MemberCard;