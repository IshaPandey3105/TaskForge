import formatDate from "../../utils/formatDate";
import { ROLE_LABELS } from "./membersConstants";
import MemberAvatar from "./MemberAvatar";

function MemberCard({ member, onOpenDetails }) {
  return (
    <div
      className="member-card clickable"
      onClick={() => onOpenDetails(member)}
    >
      <div className="member-card-top">
        <MemberAvatar user={member.user} className="member-avatar" />

        <div className="member-card-info">
          <span className="member-card-name">
            {member.user?.fullName || "Unknown"}
          </span>
          <span className="member-card-username">
            @{member.user?.username || "unknown"}
          </span>
          <span className="member-card-email">
            {member.user?.email || "—"}
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
  );
}

export default MemberCard;