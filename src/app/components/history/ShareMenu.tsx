'use client'

import { useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import { gqlFetch } from '@/lib/graphql/client'
import type { HistoryItem } from './HistorySidebar'

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

export function ShareMenu({
  item,
  onTeamsChangedAction,
}: {
  item: HistoryItem
  onTeamsChangedAction: (teams: Array<{ id: string; name: string }>) => void
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
      const newTeams = [
        ...(item.teams ?? []).filter((t) => t.id !== team.id),
        { id: team.id, name: team.name },
      ]
      onTeamsChangedAction(newTeams)
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
            {userTeams.length === 0
              ? 'No teams — create one in Settings'
              : 'Already shared with all teams'}
          </MenuItem>
        )}
        {available.map((team) => (
          <MenuItem
            key={team.id}
            onClick={() => handleShare(team)}
            disabled={sharingId === team.id}
          >
            {sharingId === team.id ? (
              <CircularProgress size={14} sx={{ mr: 1 }} />
            ) : null}
            {team.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
