import { useState, type FormEvent } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { Gathering, Participant } from '../types'

type ParticipantManagerProps = {
  gatherings: Gathering[]
  activeGatheringId: string
  participants: Participant[]
  onSelectGathering: (gatheringId: string) => void
  onRemoveGathering: (gatheringId: string) => void
  onCreateGathering: (name: string) => void
  onAddParticipant: (participantName: string) => void
  onRemoveParticipant: (participantId: string) => void
}

export default function ParticipantManager({
  gatherings,
  activeGatheringId,
  participants,
  onSelectGathering,
  onRemoveGathering,
  onCreateGathering,
  onAddParticipant,
  onRemoveParticipant,
}: ParticipantManagerProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [gatheringDialogOpen, setGatheringDialogOpen] = useState(false)
  const [gatheringName, setGatheringName] = useState('')
  const [gatheringError, setGatheringError] = useState('')
  const [expanded, setExpanded] = useState(participants.length === 0)

  const activeGathering = gatherings.find((gathering) => gathering.id === activeGatheringId)

  const handleRemoveParticipant = (participantId: string) => {
    onRemoveParticipant(participantId)
    if (participants.length === 1) {
      setExpanded(true)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Participant name cannot be empty.')
      return
    }

    const normalizedName = trimmedName.toLowerCase()
    if (participants.some((participant) => participant.name.trim().toLowerCase() === normalizedName)) {
      setError('That participant is already on the list.')
      return
    }

    onAddParticipant(trimmedName)
    setError('')
    setName('')
  }

  const closeGatheringDialog = () => {
    setGatheringDialogOpen(false)
    setGatheringName('')
    setGatheringError('')
  }

  const handleCreateGathering = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = gatheringName.trim()
    if (!trimmedName) {
      setGatheringError('Enter a name for this gathering.')
      return
    }

    onCreateGathering(trimmedName)
    closeGatheringDialog()
  }

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <Accordion
          expanded={expanded}
          onChange={(_, isExpanded) => setExpanded(isExpanded)}
          disableGutters
          elevation={0}
          sx={{ '&:before': { display: 'none' }, background: 'transparent' }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ minHeight: 56, px: 2, '& .MuiAccordionSummary-content': { my: 1 } }}
          >
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Gathering & participants
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {activeGathering?.name ?? 'No gathering selected'} · {participants.length} participants
                {participants.length ? ` · ${participants.slice(0, 2).map((participant) => participant.name).join(', ')}${participants.length > 2 ? ` +${participants.length - 2}` : ''}` : ''}
              </Typography>
            </Stack>
          </AccordionSummary>

          <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
            <Stack spacing={2}>
              <Stack spacing={1.25}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                  Gatherings
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {gatherings.map((gathering) => (
                    <Chip
                      key={gathering.id}
                      label={gathering.name}
                      clickable
                      color={gathering.id === activeGatheringId ? 'primary' : 'default'}
                      variant={gathering.id === activeGatheringId ? 'filled' : 'outlined'}
                      onClick={() => onSelectGathering(gathering.id)}
                      onDelete={() => onRemoveGathering(gathering.id)}
                      deleteIcon={<DeleteOutlineIcon />}
                      aria-label={`Select gathering ${gathering.name}; delete with delete icon`}
                    />
                  ))}
                  <Chip
                    label="Add gathering"
                    icon={<AddIcon />}
                    clickable
                    variant="outlined"
                    color="primary"
                    onClick={() => setGatheringDialogOpen(true)}
                  />
                </Stack>
              </Stack>

              <Divider />

              <div>
                <CardHeader
                  title="Manage participants"
                  subheader="Add the people joining this gathering."
                  sx={{ px: 0, py: 0, pb: 1 }}
                />
                <CardContent sx={{ px: 0, pt: 1, pb: 0 }}>
                  <form onSubmit={handleSubmit}>
                    <Stack spacing={1.5}>
                      <TextField
                        label="Participant name"
                        placeholder="e.g. Alex"
                        value={name}
                        slotProps={{ htmlInput: { inputMode: 'text' } }}
                        onChange={(event) => {
                          setName(event.target.value)
                          if (error) setError('')
                        }}
                        fullWidth
                      />
                      <Button type="submit" variant="contained" sx={{ minWidth: 0, width: '100%' }}>
                        Add Participant
                      </Button>
                    </Stack>
                  </form>

                  {error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  ) : null}

                  {participants.length ? (
                    <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 3, flexWrap: 'wrap' }}>
                      {participants.map((participant) => (
                        <Chip
                          key={participant.id}
                          label={participant.name}
                          onDelete={() => handleRemoveParticipant(participant.id)}
                          deleteIcon={<DeleteOutlineIcon />}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                      No participants yet. Add the first person to start tracking shared costs.
                    </Typography>
                  )}
                </CardContent>
              </div>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Card>

      <Dialog open={gatheringDialogOpen} onClose={closeGatheringDialog} fullWidth maxWidth="xs">
        <form onSubmit={handleCreateGathering}>
          <DialogTitle>Create a gathering</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              label="Gathering name"
              placeholder="e.g. Weekend trip"
              value={gatheringName}
              onChange={(event) => {
                setGatheringName(event.target.value)
                if (gatheringError) setGatheringError('')
              }}
              error={Boolean(gatheringError)}
              helperText={gatheringError || 'Participants and expenses will be saved separately.'}
              fullWidth
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeGatheringDialog}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
