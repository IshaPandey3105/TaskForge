import formatDate from "../../utils/formatDate";
import { ROLE_LABELS } from "./membersConstants";
import MemberAvatar from "./MemberAvatar";

function MemberDetails({ modal, onClose }) {
  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="member-detail-header">
          <MemberAvatar user={modal.member.user} className="member-detail-avatar" />

          <div className="member-detail-identity">
            <h3>{modal.member.user?.fullName || "Unknown"}</h3>
            <span>@{modal.member.user?.username || "unknown"}</span>
          </div>
        </div>

        <div className="member-detail-section">
          <span className="member-detail-label">Project Memberships</span>

          <ul className="member-membership-list">
            {modal.member.memberships.map((ms) => (
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
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemberDetails;