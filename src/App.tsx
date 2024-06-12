import './App.css'
import {
  Box,
  Button,
  CardMedia,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import usePostProcess from './usePostProcess'

const initialLambda = 2,
  initialMu = 0

const App = () => {
  const [elementsCount, setElementsCount] = useState<number>(1)
  const [lambdas, setLambdas] = useState<(number | null)[]>([initialLambda])
  const [mus, setMus] = useState<(number | null)[]>([initialMu])
  const [showLabels, setShowLabels] = useState<boolean>(false)
  const [showCount, setShowCount] = useState<number>(2)

  const { handleSubmit, handleCancel, isLoading, response, error } =
    usePostProcess({
      elementsCount,
      lambdas,
      mus,
      showLabels,
      showCount,
    })

  const showCountOptions = useMemo(
    () => new Array(elementsCount).fill(1).map((_, i) => 2 ** (i + 1)),
    [elementsCount]
  )

  return (
    <>
      <Box sx={{ margin: '40px', display: 'flex', gap: '20px' }}>
        <Box flexDirection="column" display="flex" gap="8px">
          <TextField
            type="number"
            label="Кол-во элементов сечения"
            value={elementsCount}
            sx={{ marginTop: '30px' }}
            onChange={(e) => {
              const value = e.target.value ? Math.max(1, +e.target.value) : 1
              setElementsCount(value)

              if (value) {
                setLambdas(new Array<number>(value).fill(initialLambda))
                setMus(new Array<number>(value).fill(initialMu))
                setShowCount(2 ** value)
              }
            }}
          />

          <Button
            variant="contained"
            sx={{ maxHeight: '40px' }}
            onClick={isLoading ? handleCancel : handleSubmit}
            color={isLoading ? 'error' : undefined}
            disabled={
              lambdas.some((v) => v === null) || mus.some((v) => v === null)
            }
          >
            {isLoading ? 'Отмена' : 'Отправить'}
          </Button>

          <FormControl sx={{ marginTop: '8px' }}>
            <InputLabel>Количество отображаемых состояний</InputLabel>
            <Select
              value={showCount}
              label="Количество отображаемых состояний"
              onChange={(event) => {
                setShowCount(+event.target.value)
              }}
            >
              {showCountOptions.map((opt) => (
                <MenuItem value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                value={showLabels}
                onChange={(_, checked) => setShowLabels(checked)}
              />
            }
            label="Показать подписи"
          />
        </Box>

        <Box display="flex" gap="8px" flexDirection="column">
          <Typography lineHeight="22px">
            Интенсивность отказа элемента
          </Typography>

          {lambdas.map((lambda, index) => (
            <TextField
              key={`lambda-${index}`}
              onChange={(e) => {
                const value = e.target.value
                setLambdas((prevState) =>
                  prevState.map((v, i) =>
                    i === index ? (value.length ? +value : null) : v
                  )
                )
              }}
              error={lambda === null}
              type="number"
              label={`λ${index + 1}`}
              value={lambda}
              inputProps={{
                step: 0.1,
              }}
            />
          ))}
        </Box>

        <Box display="flex" gap="8px" flexDirection="column">
          <Typography lineHeight="22px">
            Интенсивность восстановления элемента
          </Typography>

          {mus.map((mu, index) => (
            <TextField
              key={`mu-${index}`}
              onChange={(e) => {
                const value = e.target.value
                setMus((prevState) =>
                  prevState.map((v, i) =>
                    i === index ? (value.length ? +value : null) : v
                  )
                )
              }}
              type="number"
              error={mu === null}
              label={`μ${index + 1}`}
              value={mu}
              inputProps={{
                step: 0.1,
              }}
            />
          ))}
        </Box>
      </Box>
      {isLoading ? (
        <CircularProgress sx={{ marginLeft: 16 }} />
      ) : (
        !!response?.plot1?.length &&
        !!response.plot2?.length && (
          <Box display="flex" flexDirection="column" gap="16px" maxWidth="80%">
            <CardMedia
              component="img"
              src={`data:image/png;base64, ${response.plot1}`}
            />
            {response.plot2.map((img) => (
              <CardMedia
                key={img}
                component="img"
                src={`data:image/png;base64, ${img}`}
              />
            ))}
          </Box>
        )
      )}

      <Snackbar
        ContentProps={{
          sx: { backgroundColor: 'darkred' },
        }}
        open={error.isError}
        autoHideDuration={6000}
        message={error.message}
        security="error"
      />
    </>
  )
}

export default App
