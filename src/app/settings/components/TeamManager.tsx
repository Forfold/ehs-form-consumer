'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import Link from 'next/link'
import { gqlFetch } from '@/lib/graphql/client'
import { GqlTeam, GqlTeamMember, TeamCard } from './TeamCard'

// ── GraphQL fragments ─────────────────────────────────────────────────────────

const TEAMS_QUERY = `
  query {
    teams {
      id
      name
      members {
        userId
        role
        joinedAt
        user { id name email image }
      }
    }
  }
`

const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($name: String!) {
    createTeam(name: $name) {
      id name
      members { userId role joinedAt user { id name email image } }
    }
  }
`

// ── Main component ────────────────────────────────────────────────────────────

export default function TeamManager() {
  const [teams, setTeams] = useState<GqlTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    Promise.all([
      gqlFetch<{ teams: GqlTeam[] }>(TEAMS_QUERY),
      gqlFetch<{ me: { id: string; isAdmin: boolean } | null }>('query { me { id isAdmin } }'),
    ])
      .then(([{ teams }, { me }]) => {
        setTeams(teams)
        setCurrentUserId(me?.id ?? null)
        setIsAdmin(!!me?.isAdmin)
      })
      .catch(() => {/* db not configured */})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!createName.trim()) return
    setCreating(true)
    try {
      const { createTeam } = await gqlFetch<{ createTeam: GqlTeam }>(
        CREATE_TEAM_MUTATION, { name: createName.trim() }
      )
      setTeams((prev) => [createTeam, ...prev])
      setCreateName('')
    } finally {
      setCreating(false)
    }
  }

  function handleTeamDeleted(id: string) {
    setTeams((prev) => prev.filter((t) => t.id !== id))
  }

  function handleTeamRenamed(teamId: string, name: string) {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, name } : t))
  }

  function handleMemberAdded(teamId: string, member: GqlTeamMember) {
    setTeams((prev) => prev.map((t) =>
      t.id === teamId
        ? { ...t, members: [...t.members.filter((m) => m.userId !== member.userId), member] }
        : t
    ))
  }

  function handleMemberRemoved(teamId: string, userId: string) {
    setTeams((prev) => prev.map((t) =>
      t.id === teamId
        ? { ...t, members: t.members.filter((m) => m.userId !== userId) }
        : t
    ))
  }

  function handleMemberRoleChanged(teamId: string, member: GqlTeamMember) {
    setTeams((prev) => prev.map((t) =>
      t.id === teamId
        ? { ...t, members: t.members.map((m) => m.userId === member.userId ? member : m) }
        : t
    ))
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="h6">Teams</Typography>
          {isAdmin && (
            <Button
              component={Link}
              href="/settings/teams/users"
              size="small"
              startIcon={<PeopleOutlineIcon fontSize="small" />}
              sx={{ fontWeight: 600 }}
            >
              All Users
            </Button>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create teams to share form submissions with colleagues. Any team member can share
          their own submissions; owners and admins manage membership.
        </Typography>

        {/* Create team form */}
        <Box
          component="form"
          onSubmit={handleCreateTeam}
          sx={{ display: 'flex', gap: 1, mb: 3 }}
        >
          <TextField
            size="small"
            placeholder="New team name…"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            disabled={!createName.trim() || creating}
          >
            Create
          </Button>
        </Box>

        {/* Team list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : teams.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
            No teams yet. Create one above.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                currentUserId={currentUserId}
                onDeleted={handleTeamDeleted}
                onRenamed={handleTeamRenamed}
                onMemberAdded={handleMemberAdded}
                onMemberRemoved={handleMemberRemoved}
                onMemberRoleChanged={handleMemberRoleChanged}
              />
            ))}
          </Box>
        )}
    </Container>
  )
}
