import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { Participant } from '../types'
import type { DebtCalculationResult } from '../utils/calculateDebts'

type SettlementSummaryProps = {
  result: DebtCalculationResult
  participants: Participant[]
  expenseCount: number
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export default function SettlementSummary({ result, participants, expenseCount }: SettlementSummaryProps) {
  const { totalSpent, averagePerPerson, participantData, balances, settlements } = result

  if (!participants.length) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">Add participants and expenses to see the settlement breakdown.</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={0} sx={{ width: '100%' }}>
        <Grid item xs={4} sx={{ pl: 0, pt: 0, pr: 1, pb: 0 }}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%' }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: { xs: '0.58rem', sm: '0.75rem' }, lineHeight: 1.2 }}>
              Total
            </Typography>
            <Typography variant="h5" sx={{ fontSize: { xs: '0.95rem', sm: '1.5rem' }, overflowWrap: 'anywhere' }}>
              {moneyFormatter.format(totalSpent)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4} sx={{ pl: 0, pt: 0, pr: 1, pb: 0 }}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%' }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: { xs: '0.58rem', sm: '0.75rem' }, lineHeight: 1.2 }}>
              Average
            </Typography>
            <Typography variant="h5" sx={{ fontSize: { xs: '0.95rem', sm: '1.5rem' }, overflowWrap: 'anywhere' }}>
              {moneyFormatter.format(averagePerPerson)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4} sx={{ pl: 0, pt: 0, pr: 0, pb: 0 }}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%' }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: { xs: '0.58rem', sm: '0.75rem' }, lineHeight: 1.2 }}>
              Expenses
            </Typography>
            <Typography variant="h5" sx={{ fontSize: { xs: '0.95rem', sm: '1.5rem' }, overflowWrap: 'anywhere' }}>
              {expenseCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            How to settle up
          </Typography>

          {settlements.length ? (
            <Stack spacing={1.5}>
              {settlements.map((settlement, index) => (
                <Box key={`${settlement.from}-${settlement.to}-${index}`} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(79, 70, 229, 0.04)' }}>
                  <Typography variant="body1" fontWeight={600}>
                    {settlement.from} pays {settlement.to}: {moneyFormatter.format(settlement.amount)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Alert severity="success">Everyone is settled up. No transfers are required.</Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Net balances
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Participant</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell align="right">Owed</TableCell>
                  <TableCell align="right">Net</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participantData.map((entry) => (
                  <TableRow key={entry.name}>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell align="right">{moneyFormatter.format(entry.totalPaid)}</TableCell>
                    <TableCell align="right">{moneyFormatter.format(entry.totalOwed)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: (balances[entry.name] ?? 0) >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}
                    >
                      {moneyFormatter.format(entry.net)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  )
}
