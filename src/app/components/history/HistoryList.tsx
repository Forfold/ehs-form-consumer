"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import GroupsIcon from "@mui/icons-material/Groups";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { ShareMenu } from "./ShareMenu";
import { HistoryItem } from "./HistorySidebar";

interface HistoryListProps {
  items: HistoryItem[];
  onItemClick: (item: HistoryItem) => void;
  onItemTeamsChanged: (
    itemId: string,
    teams: Array<{ id: string; name: string }>,
  ) => void;
}

export function HistoryList({
  items,
  onItemClick,
  onItemTeamsChanged,
}: HistoryListProps) {
  if (items.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No forms processed yet.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {items.map((item, i) => (
        <Box key={item.id}>
          <ListItem
            disablePadding
            secondaryAction={
              <ShareMenu
                item={item}
                onTeamsChangedAction={(teams) => onItemTeamsChanged?.(item.id, teams)}
              />
            }
          >
            <ListItemButton
              onClick={() => onItemClick(item)}
              sx={{ px: 2, py: 1.5, alignItems: "flex-start", pr: 6 }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  width: "100%",
                }}
              >
                <InsertDriveFileOutlinedIcon
                  sx={{
                    fontSize: 20,
                    color: "text.disabled",
                    mt: 0.3,
                    flexShrink: 0,
                  }}
                />
                <ListItemText
                  primary={item.permitNumber}
                  secondary={
                    <Box component="span" sx={{ display: "block" }}>
                      {item.facilityName && (
                        <Box component="span" sx={{ display: "block" }}>
                          {item.facilityName}
                        </Box>
                      )}

                      {(() => {
                        const d = (item.data as { inspectionDate?: string })
                          .inspectionDate;
                        return d
                          ? new Date(d).toLocaleDateString("default", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : new Date(item.processedAt).toLocaleString();
                      })()}
                      {(item.teams ?? []).length > 0 && (
                        <Box
                          component="span"
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            mt: 0.5,
                          }}
                        >
                          {item.teams!.map((team) => (
                            <Chip
                              key={team.id}
                              icon={
                                <GroupsIcon sx={{ fontSize: "12px !important" }} />
                              }
                              label={team.name}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ height: 18, fontSize: "0.65rem" }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 600,
                    sx: {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                  secondaryTypographyProps={{ variant: "caption", component: "div" }}
                />
              </Box>
            </ListItemButton>
          </ListItem>
          {i < items.length - 1 && <Divider component="li" />}
        </Box>
      ))}
    </List>
  );
}
