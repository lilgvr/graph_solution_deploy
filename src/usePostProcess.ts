import { useCallback, useState } from 'react'

type ApiResponse = {
  plot1: string
  plot2: string[]
}

const API_URL = 'https://kurgan0v.pythonanywhere.com/process' // http://localhost:5000/process'

type Args = {
  elementsCount: number
  lambdas: (number | null)[]
  mus: (number | null)[]
  showLabels: boolean
  showCount?: number
}

type ApiError = {
  isError: boolean
  message: string
}

type ApiErrorDto = {
  error: string
}

type UsePostProcessHook = (args: Args) => {
  isLoading: boolean
  handleSubmit: () => void
  handleCancel: () => void
  response: ApiResponse | null
  error: ApiError
}

const usePostProcess: UsePostProcessHook = ({
  elementsCount,
  lambdas,
  mus,
  showLabels,
  showCount = 2,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<ApiError>({
    isError: false,
    message: '',
  })
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)

  const handleSubmit = useCallback(() => {
    setIsLoading(true)
    const controller = new AbortController()
    setAbortController(controller)

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: elementsCount,
        array1: lambdas,
        array2: mus,
        show_labels: showLabels,
        show_count: showCount,
      }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((res: ApiResponse | ApiErrorDto) => {
        if ('error' in res) {
          setError({
            isError: true,
            message: res.error,
          })
        } else {
          setResponse(res)
          setError({
            isError: false,
            message: '',
          })
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [elementsCount, lambdas, mus, showCount, showLabels])

  const handleCancel = useCallback(() => {
    abortController?.abort()
  }, [abortController])

  return {
    handleSubmit,
    handleCancel,
    isLoading,
    response,
    error,
  }
}

export default usePostProcess
