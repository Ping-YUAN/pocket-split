import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useEffect, useMemo, useState } from 'react';
import appIcon from '../assets/apple-touch-icon.png';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import ParticipantManager from './components/ParticipantManager';
import SettlementSummary from './components/SettlementSummary';
import type { Expense, Gathering, Participant } from './types';
import { calculateDebts } from './utils/calculateDebts';

const STORAGE_KEY = 'pocket_split_state_v3'
const PREVIOUS_STORAGE_KEY = 'pocket_split_state_v2'
const LEGACY_STORAGE_KEY = 'pocket_split_state_v1'

type AppState = {
  gatherings: Gathering[]
  activeGatheringId: string
}

type ConfirmationRequest = {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}

const createId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createGathering = (name: string): Gathering => ({
  id: createId('gathering'),
  name,
  participants: [],
  expenses: [],
  createdAt: new Date().toISOString(),
})

const toParticipant = (value: unknown, fallbackIndex: number): Participant => {
  if (typeof value === 'object' && value && 'name' in value) {
    const candidate = value as { id?: string; name?: string }
    const name = typeof candidate.name === 'string' ? candidate.name.trim() : `Participant ${fallbackIndex + 1}`

    return {
      id: typeof candidate.id === 'string' ? candidate.id : createId('participant'),
      name: name || `Participant ${fallbackIndex + 1}`,
    }
  }

  return {
    id: createId('participant'),
    name: `Participant ${fallbackIndex + 1}`,
  }
}

const toExpense = (value: unknown, fallbackIndex: number): Expense => {
  if (typeof value === 'object' && value) {
    const candidate = value as {
      id?: string
      description?: string
      amount?: number
      payerId?: string
      payer?: string
      participantIds?: string[]
      participants?: string[]
      date?: string
    }

    const participants = Array.isArray(candidate.participantIds)
      ? candidate.participantIds.filter((id): id is string => typeof id === 'string')
      : Array.isArray(candidate.participants)
        ? candidate.participants.filter((entry): entry is string => typeof entry === 'string')
        : []

    const payerId = typeof candidate.payerId === 'string'
      ? candidate.payerId
      : typeof candidate.payer === 'string'
        ? candidate.payer
        : ''

    return {
      id: typeof candidate.id === 'string' ? candidate.id : createId('expense'),
      description: typeof candidate.description === 'string' && candidate.description.trim()
        ? candidate.description.trim()
        : `Expense ${fallbackIndex + 1}`,
      amount: Number(candidate.amount) || 0,
      payerId,
      participantIds: participants,
      date: typeof candidate.date === 'string' ? candidate.date : new Date().toISOString(),
    }
  }

  return {
    id: createId('expense'),
    description: `Expense ${fallbackIndex + 1}`,
    amount: 0,
    payerId: '',
    participantIds: [],
    date: new Date().toISOString(),
  }
}

const normalizeExpenses = (values: unknown[]): Expense[] =>
  values
    .map(toExpense)
    .filter((expense) => expense.payerId && expense.participantIds.length > 0)

const toGathering = (value: unknown, fallbackIndex: number): Gathering | null => {
  if (typeof value !== 'object' || !value) return null

  const candidate = value as {
    id?: unknown
    name?: unknown
    participants?: unknown
    expenses?: unknown
    createdAt?: unknown
  }
  if (!Array.isArray(candidate.participants) || !Array.isArray(candidate.expenses)) return null

  return {
    id: typeof candidate.id === 'string' ? candidate.id : createId('gathering'),
    name: typeof candidate.name === 'string' && candidate.name.trim()
      ? candidate.name.trim()
      : `Gathering ${fallbackIndex + 1}`,
    participants: candidate.participants.map(toParticipant),
    expenses: normalizeExpenses(candidate.expenses),
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
  }
}

function loadInitialState(): AppState {
  try {
    const candidateKeys = [STORAGE_KEY, PREVIOUS_STORAGE_KEY, LEGACY_STORAGE_KEY]

    for (const key of candidateKeys) {
      const savedState = localStorage.getItem(key)
      if (!savedState) continue

      const parsed = JSON.parse(savedState) as {
        gatherings?: unknown[]
        activeGatheringId?: unknown
        participants?: unknown[]
        expenses?: unknown[]
      }

      if (parsed && Array.isArray(parsed.gatherings)) {
        const gatherings = parsed.gatherings
          .map(toGathering)
          .filter((gathering): gathering is Gathering => gathering !== null)
        if (!gatherings.length) continue
        const activeGatheringId = typeof parsed.activeGatheringId === 'string' &&
          gatherings.some((gathering) => gathering.id === parsed.activeGatheringId)
          ? parsed.activeGatheringId
          : gatherings[0].id

        return { gatherings, activeGatheringId }
      }

      if (parsed && Array.isArray(parsed.participants) && Array.isArray(parsed.expenses)) {
        const migratedGathering = createGathering('My gathering')
        migratedGathering.participants = parsed.participants.map(toParticipant)
        migratedGathering.expenses = normalizeExpenses(parsed.expenses)

        return { gatherings: [migratedGathering], activeGatheringId: migratedGathering.id }
      }
    }
  } catch {
    // A fresh gathering keeps the app usable if saved browser data cannot be read.
  }

  const initialGathering = createGathering('My first gathering')
  return { gatherings: [initialGathering], activeGatheringId: initialGathering.id }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(loadInitialState)
  const [activeTab, setActiveTab] = useState<number>(0)
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null)
  const activeGathering = appState.gatherings.find(
    (gathering) => gathering.id === appState.activeGatheringId,
  ) ?? appState.gatherings[0]
  const participants = activeGathering.participants
  const expenses = activeGathering.expenses

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState))
  }, [appState])

  const settlementResult = useMemo(
    () => calculateDebts({ participants, expenses }),
    [participants, expenses],
  )

  const updateActiveGathering = (update: (gathering: Gathering) => Gathering) => {
    setAppState((current) => ({
      ...current,
      gatherings: current.gatherings.map((gathering) =>
        gathering.id === current.activeGatheringId ? update(gathering) : gathering,
      ),
    }))
  }

  const requestConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = 'Delete',
  ) => {
    setConfirmation({ title, message, confirmLabel, onConfirm })
  }

  const addGathering = (name: string) => {
    const gathering = createGathering(name)
    setAppState((current) => ({
      gatherings: [...current.gatherings, gathering],
      activeGatheringId: gathering.id,
    }))
    setActiveTab(0)
  }

  const selectGathering = (gatheringId: string) => {
    setAppState((current) => ({ ...current, activeGatheringId: gatheringId }))
    setActiveTab(0)
  }

  const removeGathering = (gatheringId: string) => {
    const gathering = appState.gatherings.find((item) => item.id === gatheringId)
    if (!gathering) return

    requestConfirmation(
      'Delete gathering?',
      `Delete "${gathering.name}" and its ${gathering.participants.length} participant(s) and ${gathering.expenses.length} expense(s)? This cannot be undone.`,
      () => {
        const freshGathering = createGathering('My first gathering')
        setAppState((current) => {
          const remainingGatherings = current.gatherings.filter((item) => item.id !== gatheringId)
          if (!remainingGatherings.length) {
            return { gatherings: [freshGathering], activeGatheringId: freshGathering.id }
          }

          const activeGatheringId = current.activeGatheringId === gatheringId
            ? remainingGatherings[0].id
            : current.activeGatheringId

          return { gatherings: remainingGatherings, activeGatheringId }
        })

        if (appState.activeGatheringId === gatheringId) {
          setActiveTab(0)
        }
      },
      'Delete gathering',
    )
  }

  const addParticipant = (participantName: string) => {
    updateActiveGathering((gathering) => ({
      ...gathering,
      participants: [
        ...gathering.participants,
        {
          id: createId('participant'),
          name: participantName.trim(),
        },
      ],
    }))
  }

  const removeParticipant = (participantId: string) => {
    const linkedExpenses = expenses.filter(
      (expense) => expense.payerId === participantId || expense.participantIds.includes(participantId),
    )

    const participantName = participants.find((participant) => participant.id === participantId)?.name
    const confirmationMessage = linkedExpenses.length > 0
      ? `${participantName ?? 'This participant'} is linked to ${linkedExpenses.length} expense(s). Removing them will also clear related allocations.`
      : `Remove ${participantName ?? 'this participant'} from this gathering?`

    requestConfirmation('Remove participant?', confirmationMessage, () => {
      updateActiveGathering((gathering) => ({
        ...gathering,
        participants: gathering.participants.filter((participant) => participant.id !== participantId),
        expenses: gathering.expenses
          .map((expense) => ({
            ...expense,
            payerId: expense.payerId === participantId ? '' : expense.payerId,
            participantIds: expense.participantIds.filter((candidateId) => candidateId !== participantId),
          }))
          .filter((expense) => expense.payerId && expense.participantIds.length > 0),
      }))
    })
  }

  const addExpense = (expense: Expense) => {
    updateActiveGathering((gathering) => ({
      ...gathering,
      expenses: [...gathering.expenses, expense],
    }))
  }

  const removeExpense = (expenseId: string) => {
    const expense = expenses.find((item) => item.id === expenseId)
    if (!expense) return

    requestConfirmation(
      'Remove expense?',
      `Remove "${expense.description}" from this gathering?`,
      () => {
        updateActiveGathering((gathering) => ({
          ...gathering,
          expenses: gathering.expenses.filter((item) => item.id !== expenseId),
        }))
      },
    )
  }

  const clearExpenses = () => {
    const gatheringId = activeGathering.id
    const expenseCount = expenses.length
    if (!expenseCount) return

    requestConfirmation(
      'Clear all expenses?',
      `Remove all ${expenseCount} expense(s) from "${activeGathering.name}"? Participants and the gathering will be kept.`,
      () => {
        setAppState((current) => ({
          ...current,
          gatherings: current.gatherings.map((gathering) =>
            gathering.id === gatheringId ? { ...gathering, expenses: [] } : gathering,
          ),
        }))
      },
      'Clear expenses',
    )
  }

  const resetAll = () => {
    requestConfirmation(
      'Reset all data?',
      'Clear all saved gatherings, participants, and expenses and start fresh? This action cannot be undone.',
      () => {
        const freshGathering = createGathering('My first gathering')
        setAppState({ gatherings: [freshGathering], activeGatheringId: freshGathering.id })
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(PREVIOUS_STORAGE_KEY)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        setActiveTab(0)
      },
      'Reset all',
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="primary" elevation={0} sx={{ top: 0, zIndex: 1100 }}>
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Box
                component="img"
                src={appIcon}
                alt=""
                aria-hidden="true"
                sx={{ width: 32, height: 32, flexShrink: 0, borderRadius: 1 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ lineHeight: 1.2, fontWeight: 800 }}>
                  Pocket Split
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
                  Smart group expense settlement
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <IconButton
                component="a"
                href="https://github.com/Ping-YUAN/pocket-split"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Pocket Split GitHub repository"
                color="inherit"
              >
                <GitHubIcon />
              </IconButton>
              <Button
                variant="contained"
                color="secondary"
                onClick={resetAll}
                sx={{ minWidth: 0, px: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Reset all
              </Button>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        <Tabs
          value={activeTab}
          onChange={(_, nextTab) => setActiveTab(nextTab as number)}
          variant="fullWidth"
          sx={{
            mb: 2,
            '& .MuiTabs-flexContainer': { gap: 1 },
            '& .MuiTab-root': {
              borderRadius: 2,
              minHeight: 42,
              textTransform: 'none',
              fontWeight: 700,
            },
          }}
        >
          <Tab label="Expenses" />
          <Tab label="Settlement" />
        </Tabs>

        {activeTab === 0 ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={4}>
              <ParticipantManager
                gatherings={appState.gatherings}
                activeGatheringId={activeGathering.id}
                participants={participants}
                onSelectGathering={selectGathering}
                onRemoveGathering={removeGathering}
                onCreateGathering={addGathering}
                onAddParticipant={addParticipant}
                onRemoveParticipant={removeParticipant}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <ExpenseForm participants={participants} onAddExpense={addExpense} />
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <ExpenseList
                expenses={expenses}
                participants={participants}
                onRemoveExpense={removeExpense}
                onClearExpenses={clearExpenses}
              />
            </Grid>
          </Grid>
        ) : (
          <SettlementSummary
            result={settlementResult}
            participants={participants}
            expenseCount={expenses.length}
          />
        )}
      </Container>
      <Dialog
        open={Boolean(confirmation)}
        onClose={() => setConfirmation(null)}
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="confirmation-dialog-title">{confirmation?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirmation-dialog-description">
            {confirmation?.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmation(null)} color="inherit">Cancel</Button>
          <Button
            onClick={() => {
              const pendingConfirmation = confirmation
              setConfirmation(null)
              pendingConfirmation?.onConfirm()
            }}
            color="error"
            variant="contained"
            autoFocus
          >
            {confirmation?.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
