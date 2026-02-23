"use client";

import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { AdminUser, SlimTeam, userInitials, ROLE_LABELS } from "./graphql";

interface UserRowProps {
  user: AdminUser;
  currentUserId: string | null;
  allTeams: SlimTeam[];
  busyUserIds: Set<string>;
  busyMemberships: Set<string>;
  onToggleAdmin: (user: AdminUser) => void;
  onAddTeam: (userId: string) => void;
  onRemoveFromTeam: (userId: string, teamId: string) => void;
  onDelete: (userId: string) => void;
}

export function UserRow({
  user,
  currentUserId,
  allTeams,
  busyUserIds,
  busyMemberships,
  onToggleAdmin,
  onAddTeam,
  onRemoveFromTeam,
  onDelete,
}: UserRowProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const isBusy = busyUserIds.has(user.id);
  const isSelf = user.id === currentUserId;

  function openMenu(e: React.MouseEvent<HTMLElement>) {
    setMenuAnchor(e.currentTarget);
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  function handleToggleAdmin() {
    closeMenu();
    onToggleAdmin(user);
  }

  function handleAddTeam() {
    closeMenu();
    onAddTeam(user.id);
  }

  function handleDelete() {
    closeMenu();
    onDelete(user.id);
  }

  return (
    <Paper variant="outlined" sx={{ mb: 1.5, p: 2, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        {/* Avatar */}
        <Avatar
          src={user.image ?? undefined}
          alt={user.name ?? user.email ?? "?"}
          sx={{ width: 44, height: 44, flexShrink: 0, mt: 0.25 }}
        >
          {userInitials(user)}
        </Avatar>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Name + badges */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 0.75,
              mb: 0.25,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              {user.name ?? user.email}
            </Typography>
            {isSelf && (
              <Typography component="span" variant="caption" color="text.disabled">
                (you)
              </Typography>
            )}
            {user.isAdmin && (
              <Chip
                label="Site Admin"
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: "0.6875rem", fontWeight: 600 }}
              />
            )}
            {user.formCount > 0 && (
              <Chip
                label={`${user.formCount} form${user.formCount !== 1 ? "s" : ""}`}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.6875rem" }}
              />
            )}
          </Box>

          {/* Email (only if name was shown above) */}
          {user.name && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.75 }}
            >
              {user.email}
            </Typography>
          )}

          {/* Team membership chips */}
          {user.teamMemberships.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                mt: user.name ? 0 : 0.5,
              }}
            >
              {user.teamMemberships.map((m) => {
                const memberKey = `${user.id}:${m.teamId}`;
                const isRemoving = busyMemberships.has(memberKey);
                return (
                  <Chip
                    key={m.teamId}
                    label={`${m.teamName} · ${ROLE_LABELS[m.role] ?? m.role}`}
                    size="small"
                    variant="outlined"
                    disabled={isRemoving}
                    onDelete={
                      isSelf ? undefined : () => onRemoveFromTeam(user.id, m.teamId)
                    }
                    deleteIcon={
                      isRemoving ? (
                        <CircularProgress size={10} />
                      ) : (
                        <CloseIcon sx={{ fontSize: "12px !important" }} />
                      )
                    }
                    sx={{ fontSize: "0.6875rem" }}
                  />
                );
              })}
            </Box>
          ) : (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ mt: user.name ? 0 : 0.5, display: "block" }}
            >
              No teams
            </Typography>
          )}
        </Box>

        {/* Three-dot menu button */}
        <IconButton
          size="small"
          onClick={openMenu}
          disabled={isBusy}
          sx={{ flexShrink: 0, mt: 0.25 }}
        >
          {isBusy ? (
            <CircularProgress size={16} />
          ) : (
            <MoreVertIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem onClick={handleToggleAdmin} disabled={isSelf}>
          {user.isAdmin ? "Remove Site Admin" : "Make Site Admin"}
        </MenuItem>
        <MenuItem onClick={handleAddTeam} disabled={allTeams.length === 0}>
          Add to Team
        </MenuItem>
        <MenuItem
          onClick={handleDelete}
          disabled={isSelf}
          sx={{ color: "error.main" }}
        >
          Delete User
        </MenuItem>
      </Menu>
    </Paper>
  );
}
