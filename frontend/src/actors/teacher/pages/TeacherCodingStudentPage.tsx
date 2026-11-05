import { useParams } from 'react-router-dom'
import { CodingStudentView } from '@/components/shared/coding/CodingStudentView'
import { useTeacherCodingStudent } from '../api/coding.api'

export function TeacherCodingStudentPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, refetch } = useTeacherCodingStudent(id)
  return (
    <CodingStudentView data={data} isLoading={isLoading} isError={isError} onRetry={refetch} backHref="/teacher/coding" />
  )
}
