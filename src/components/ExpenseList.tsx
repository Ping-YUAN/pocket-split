import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import type { Expense, Participant } from '../types'

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

type ExpenseListProps = {
  expenses: Expense[]
  participants: Participant[]
  onRemoveExpense: (expenseId: string) => void
}

export default function ExpenseList({ expenses, participants, onRemoveExpense }: ExpenseListProps) {
  const participantMap = new Map(participants.map((participant) => [participant.id, participant.name]))

  if (!expenses.length) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title="Expense log"
          subheader="Recent purchases and their respective splits."
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            No expenses logged yet. Add your first purchase to generate settlement suggestions.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Expense log"
        subheader="Review every item and remove it if needed."
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <List disablePadding>
          {expenses.map((expense, index) => {
            const payerName = participantMap.get(expense.payerId) ?? 'Unknown'
            const participantNames = expense.participantIds
              .map((participantId) => participantMap.get(participantId))
              .filter((name): name is string => Boolean(name))

            return (
              <div key={expense.id ?? `${expense.description}-${index}`}>
                <ListItem alignItems="flex-start" disableGutters>
                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {expense.description}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                          {moneyFormatter.format(expense.amount)}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Payer: <strong>{payerName}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(expense.date).toLocaleDateString()}
                        </Typography>
                        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                          {participantNames.map((participantName) => (
                            <Chip key={`${expense.id}-${participantName}`} label={participantName} size="small" />
                          ))}
                        </Stack>
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label={`delete expense ${expense.description}`}
                      onClick={() => onRemoveExpense(expense.id)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < expenses.length - 1 ? <Divider sx={{ my: 1 }} /> : null}
              </div>
            )
          })}
        </List>
      </CardContent>
    </Card>
  )
}
