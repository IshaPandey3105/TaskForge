function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Renders the member avatar image when available, otherwise an initials
// fallback. `className` controls sizing via CSS (.member-avatar,
// .member-avatar-sm, .member-detail-avatar).
function MemberAvatar({ user, className }) {
  const avatarUrl = user?.avatar?.url;
  const showAvatar = avatarUrl && !avatarUrl.includes("placehold.co");

  if (showAvatar) {
    return <img className={className} src={avatarUrl} alt={user?.fullName} />;
  }

  return (
    <span className={`${className} fallback`}>
      {getInitials(user?.fullName || user?.username)}
    </span>
  );
}

export default MemberAvatar;