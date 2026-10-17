import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Expense, Participant } from '../types';

const createExpenseId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `expense-${Date.now()}-${Math.random()}`

type ExpenseFormProps = {
  participants: Participant[]
  onAddExpense: (expense: Expense) => void
}

export default function ExpenseForm({ participants, onAddExpense }: ExpenseFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [payerId, setPayerId] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [error, setError] = useState('')
  const previousParticipantIdsRef = useRef<string[]>([])
  const selectionWasEmptyRef = useRef<boolean>(true)

  useEffect(() => {
    selectionWasEmptyRef.current = selectedParticipants.length === 0
  }, [selectedParticipants.length])

  useEffect(() => {
    if (!participants.length) {
      setPayerId('')
      setSelectedParticipants([])
      previousParticipantIdsRef.current = []
      return
    }

    const participantIds = participants.map((participant) => participant.id)
    setPayerId((current) => (current && participantIds.includes(current) ? current : participants[0].id))

    const previousIds = previousParticipantIdsRef.current
    const newlyAddedIds = participantIds.filter((participantId) => !previousIds.includes(participantId))

    if (newlyAddedIds.length > 0) {
      setSelectedParticipants((current) => {
        const shouldAutoSelect = !current.length || current.length === previousIds.length
        if (!shouldAutoSelect) {
          return current
        }

        return Array.from(new Set([...current, ...newlyAddedIds]))
      })
    }

    if (!previousIds.length && selectionWasEmptyRef.current) {
      setSelectedParticipants(participantIds)
    }

    previousParticipantIdsRef.current = participantIds
  }, [participants])

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((current) =>
      current.includes(participantId)
        ? current.filter((item) => item !== participantId)
        : [...current, participantId],
    )
  }

  const handleSelectAll = () => {
    setSelectedParticipants(participants.map((participant) => participant.id))
  }

  const handleClearAll = () => {
    setSelectedParticipants([])
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!participants.length) {
      setError('Add a participant before logging an expense.')
      return
    }

    const trimmedDescription = description.trim()
    const parsedAmount = Number(amount)

    if (!trimmedDescription) {
      setError('Expense description is required.')
      return
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Expense amount must be a positive number.')
      return
    }

    if (!payerId || !participants.some((participant) => participant.id === payerId)) {
      setError('Select the person who paid.')
      return
    }

    if (!selectedParticipants.length) {
      setError('Select at least one participant in the split.')
      return
    }

    onAddExpense({
      id: createExpenseId(),
      description: trimmedDescription,
      amount: parsedAmount,
      payerId,
      participantIds: selectedParticipants,
      date: new Date().toISOString(),
    })

    setDescription('')
    setAmount('')
    setPayerId(participants[0]?.id ?? '')
    setSelectedParticipants(participants.map((participant) => participant.id))
    setError('')
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Add expense"
        subheader="Track a purchase and split it with the group."
        sx={{
          px: 2,
          pt: 0.5,
          pb: 0,
          '& .MuiCardHeader-title': { lineHeight: 1.2, pt: 0.5 },
          '& .MuiCardHeader-subheader': { lineHeight: 1.2 },
        }}
      />
      <CardContent sx={{ px: 2, pt: 0.75, pb: 0, '&:last-child': { pb: 1 } }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={1}>
            <TextField
              label="Description"
              placeholder="Dinner at Bistro"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                if (error) setError('')
              }}
              fullWidth
            />

            <Stack direction="row" spacing={1}>
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                  if (error) setError('')
                }}
                sx={{ flex: 1, minWidth: 0 }}
                inputProps={{ min: 0, step: 0.01, inputMode: 'decimal' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />

              <TextField
                select
                label="Who paid?"
                value={payerId}
                onChange={(event) => {
                  setPayerId(event.target.value)
                  if (error) setError('')
                }}
                sx={{ flex: 1, minWidth: 0 }}
                disabled={!participants.length}
                SelectProps={{
                  sx: { '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis' } },
                }}
              >
                {participants.map((participant) => (
                  <MenuItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <FormControl component="fieldset" variant="standard">
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={0.5}
                sx={{ mb: 0.5 }}
              >
                <Typography variant="subtitle2" color="text.secondary" sx={{ flexShrink: 0 }}>
                  Split with
                </Typography>
                <Stack direction="row" spacing={0}>
                  <Button size="small" variant="text" onClick={handleSelectAll} sx={{ minWidth: 0, px: 0.75 }}>
                    Select All
                  </Button>
                  <Button size="small" variant="text" onClick={handleClearAll} sx={{ minWidth: 0, px: 0.75 }}>
                    Clear All
                  </Button>
                </Stack>
              </Stack>

              <FormGroup
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  columnGap: 1,
                  rowGap: 0.5,
                }}
              >
                {participants.map((participant) => (
                  <FormControlLabel
                    key={participant.id}
                    control={
                      <Checkbox
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={() => toggleParticipant(participant.id)}
                        name={participant.id}
                      />
                    }
                    label={participant.name}
                    sx={{ m: 0, minWidth: 0 }}
                  />
                ))}
              </FormGroup>
            </FormControl>

            {participants.length === 0 && (
              <Alert severity="info">Add at least one participant before recording an expense.</Alert>
            )}

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 1,
                py: 0.5,
                bgcolor: 'background.paper',
              }}
            >
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!participants.length}
                sx={{ width: '100%' }}
              >
                Add Expense
              </Button>
            </Box>
          </Stack>
        </form>
      </CardContent>
    </Card>
  )
}
