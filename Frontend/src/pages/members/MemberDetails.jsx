import { useState } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import formatDate from "../../utils/formatDate";
import { ROLE_LABELS } from "./membersConstants";
import MemberAvatar from "./MemberAvatar";

function MemberDetails({ modal, onClose, onMemberRemoved, rolesByProject }) {
  const user = useAuthStore((state) => state.user);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);

  if (!modal) return null;

  const { member } = modal;
  const isGlobalAdmin = user?.role === "admin";

  const canRemoveFromProject = (targetMembershipRole, projectId) => {
    // Global Admin can remove anyone (except themselves)
    if (isGlobalAdmin) {
      return member.user?._id !== user?._id;
    }

    // Otherwise, gating is by the CURRENT USER's role in that project
    const myProjectRole = rolesByProject?.[projectId];
    if (myProjectRole !== "admin" && myProjectRole !== "project-admin") {
      // Normal members cannot remove anyone
      return false;
    }

    // Project Admin can remove normal Members only:
    // never Global Admins, never Project Admins, never themselves
    const targetIsGlobalAdmin = member.user?.role === "admin";
    return (
      !targetIsGlobalAdmin &&
      targetMembershipRole === "member" &&
      member.user?._id !== user?._id
    );
  };

  const handleRemoveFromProject = async (projectId, projectName) => {
    if (!confirmRemove || confirmRemove.projectId !== projectId) {
      setConfirmRemove({ projectId, projectName });
      setRemoveError("");
      return;
    }

    setRemoving(true);
    setRemoveError("");

    try {
      await api.delete(`/projects/${projectId}/members/${member.user._id}`);
      setConfirmRemove(null);
      if (onMemberRemoved) {
        onMemberRemoved();
      }
      onClose();
    } catch (err) {
      setRemoveError(
        err.response?.data?.message || "Unable to remove member from project."
      );
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="member-detail-header">
          <MemberAvatar user={modal.member.user} className="member-detail-avatar" />

          <div className="member-detail-identity">
            <h3>{modal.member.user?.fullName || "Unknown"}</h3>
            <span>@{modal.member.user?.username || "unknown"}</span>
            <span className="member-detail-email">
              {modal.member.user?.email || "—"}
            </span>
          </div>
        </div>

        {removeError && <p className="modal-error">{removeError}</p>}

        <div className="member-detail-section">
          <span className="member-detail-label">Project Memberships</span>

          <ul className="member-membership-list">
            {modal.member.memberships.map((ms) => {
              const canRemove = canRemoveFromProject(ms.role, ms.projectId);
              return (
                <li key={ms.projectId}>
                  <div className="member-membership-info">
                    <span className="member-membership-project">
                      {ms.projectName}
                    </span>
                    <span className="member-membership-date">
                      Joined {formatDate(ms.joinedAt)}
                    </span>
                  </div>
                  <div className="member-membership-actions">
                    <span className={`role-badge ${ms.role}`}>
                      {ms.role === "admin" ? "Project Admin" : ROLE_LABELS[ms.role]}
                    </span>

                    {canRemove && (
                      <>
                        {confirmRemove?.projectId === ms.projectId ? (
                          <div className="remove-confirm">
                            <span className="remove-confirm-text">Remove?</span>
                            <button
                              type="button"
                              className="modal-danger"
                              onClick={() => handleRemoveFromProject(ms.projectId, ms.projectName)}
                              disabled={removing}
                            >
                              {removing ? "Removing..." : "Yes, Remove"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRemove(null)}
                              disabled={removing}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="members-remove-btn"
                            onClick={() => handleRemoveFromProject(ms.projectId, ms.projectName)}
                          >
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

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