import { useParams } from 'react-router-dom'
import { CodingStudentView } from '@/components/shared/coding/CodingStudentView'
import { useCodingStudent } from '../api/coding.api'

export function CodingStudentPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, refetch } = useCodingStudent(id)
  return (
    <CodingStudentView data={data} isLoading={isLoading} isError={isError} onRetry={refetch} backHref="/admin/coding" />
  )
}
