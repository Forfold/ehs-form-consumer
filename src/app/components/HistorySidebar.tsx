'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import GroupsIcon from '@mui/icons-material/Groups'
import HistoryIcon from '@mui/icons-material/History'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import { gqlFetch } from '@/lib/graphql/client'

export interface HistoryItem {
  id: string
  facilityName: string | null
  fileName: string
  processedAt: string
  data: Record<string, unknown>
  teams?: Array<{ id: string; name: string }>
}

interface Props {
  open: boolean
  onClose: () => void
  items: HistoryItem[]
  onItemTeamsChanged?: (itemId: string, teams: Array<{ id: string; name: string }>) => void
}

const TEAMS_QUERY = `
  query {
    teams {
      id
      name
      members { userId role }
    }
  }
`

const ADD_SUBMISSION_TO_TEAM = `
  mutation AddSubmissionToTeam($submissionId: ID!, $teamId: ID!) {
    addSubmissionToTeam(submissionId: $submissionId, teamId: $teamId)
  }
`

interface GqlTeam {
  id: string
  name: string
  members: Array<{ userId: string; role: string }>
}

function ShareMenu({
  item,
  onTeamsChanged,
}: {
  item: HistoryItem
  onTeamsChanged: (teams: Array<{ id: string; name: string }>) => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [userTeams, setUserTeams] = useState<GqlTeam[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [sharingId, setSharingId] = useState<string | null>(null)

  async function handleOpen(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    setAnchor(e.currentTarget)
    setLoadingTeams(true)
    try {
      const { teams } = await gqlFetch<{ teams: GqlTeam[] }>(TEAMS_QUERY)
      setUserTeams(teams)
    } finally {
      setLoadingTeams(false)
    }
  }

  async function handleShare(team: GqlTeam) {
    setSharingId(team.id)
    try {
      await gqlFetch(ADD_SUBMISSION_TO_TEAM, {
        submissionId: item.id,
        teamId: team.id,
      })
      const newTeams = [...(item.teams ?? []).filter((t) => t.id !== team.id), { id: team.id, name: team.name }]
      onTeamsChanged(newTeams)
    } finally {
      setSharingId(null)
      setAnchor(null)
    }
  }

  const alreadySharedIds = new Set((item.teams ?? []).map((t) => t.id))
  const available = userTeams.filter((t) => !alreadySharedIds.has(t.id))

  return (
    <>
      <Tooltip title="Share with team">
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
        >
          <GroupAddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        {loadingTeams && (
          <MenuItem disabled>
            <CircularProgress size={16} sx={{ mr: 1 }} /> Loading…
          </MenuItem>
        )}
        {!loadingTeams && available.length === 0 && (
          <MenuItem disabled>
            {userTeams.length === 0 ? 'No teams — create one in Settings' : 'Already shared with all teams'}
          </MenuItem>
        )}
        {available.map((team) => (
          <MenuItem
            key={team.id}
            onClick={() => handleShare(team)}
            disabled={sharingId === team.id}
          >
            {sharingId === team.id ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
            {team.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default function HistorySidebar({ open, onClose, items, onItemTeamsChanged }: Props) {
  const router = useRouter()

  function handleSelect(item: HistoryItem) {
    router.push(`/forms/${item.id}`)
    onClose()
  }

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 300 } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 1 }}>
        <HistoryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
          Processed Forms
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      {items.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No forms processed yet.
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {items.map((item, i) => (
            <Box key={item.id}>
              <ListItem
                disablePadding
                secondaryAction={
                  <ShareMenu
                    item={item}
                    onTeamsChanged={(teams) => onItemTeamsChanged?.(item.id, teams)}
                  />
                }
              >
                <ListItemButton
                  onClick={() => handleSelect(item)}
                  sx={{ px: 2, py: 1.5, alignItems: 'flex-start', pr: 6 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                    <InsertDriveFileOutlinedIcon
                      sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3, flexShrink: 0 }}
                    />
                    <ListItemText
                      primary={item.facilityName ?? item.fileName}
                      secondary={
                        <Box component="span" sx={{ display: 'block' }}>
                          {item.facilityName && (
                            <Box component="span" sx={{ display: 'block' }}>
                              {item.fileName}
                            </Box>
                          )}
                          {new Date(item.processedAt).toLocaleString()}
                          {(item.teams ?? []).length > 0 && (
                            <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {item.teams!.map((team) => (
                                <Chip
                                  key={team.id}
                                  icon={<GroupsIcon sx={{ fontSize: '12px !important' }} />}
                                  label={team.name}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 600,
                        sx: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                      }}
                      secondaryTypographyProps={{ variant: 'caption', component: 'div' }}
                    />
                  </Box>
                </ListItemButton>
              </ListItem>
              {i < items.length - 1 && <Divider component="li" />}
            </Box>
          ))}
        </List>
      )}
    </Drawer>
  )
}
