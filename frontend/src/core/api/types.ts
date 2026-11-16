// Types communs renvoyes par l'API NestJS

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  archived?: boolean
}

export interface UserSummary {
  id: string
  email: string | null
  phone: string | null
  firstName: string
  lastName: string
  locale: string
  isActive: boolean
  lastLoginAt: string | null
}

export interface PersonName {
  firstName: string
  lastName: string
}

export interface Me {
  id: string
  email: string | null
  phone: string | null
  role: Role
  firstName: string
  lastName: string
  locale: string
  student: { id: string } | null
  parent: { id: string } | null
  teacher: { id: string } | null
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

/** Champs communs a la creation de tout compte. */
export interface AccountInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  password?: string
  locale?: string
}

export type WithTemporaryPassword<T> = T & { temporaryPassword?: string }

// ---------- Planning / seances ----------

export type SessionStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

/** Periode affichee par un calendrier (ISO 8601). */
export interface DateRange {
  from: string
  to: string
}

/** Seance vue par un eleve ou un parent (avec la presence de l'eleve). */
export interface StudentSession {
  id: string
  startsAt: string
  endsAt: string
  status: SessionStatus
  isOnline: boolean
  meetingUrl: string | null
  homework: string | null
  group: { id: string; name: string; subject: string }
  room: { name: string } | null
  teacher: { user: PersonName }
  attendance: { status: AttendanceStatus; note: string | null } | null
}

// ---------- Paiements ----------
// Especes uniquement. Chaque eleve a SA serie de N presences dans un groupe :
// serie terminee non payee = "a payer" ; il peut payer avant ou apres.

/** PAID : serie en cours payee · DUE : serie terminee non payee · PENDING : en cours, pas encore payee */
export type SeriesState = 'PAID' | 'DUE' | 'PENDING'

export interface PaymentSummary {
  students: number
  paid: number
  due: number
  pending: number
  /** Montants en TND */
  dueAmount: number
  collectedThisMonth: number
}

export interface PaymentGroup {
  id: string
  name: string
  subject: string
  level: string
  section: string
  monthlySessions: number
  monthlyFee: number
  teacher: { id: string; user: PersonName }
}

export interface PaymentsOverview {
  totals: PaymentSummary & { groups: number }
  items: (PaymentSummary & { group: PaymentGroup })[]
}

/** Situation d'un eleve dans un groupe. */
export interface StudentSeries {
  student: { id: string; user: PersonName }
  fee: number
  /** Numero de la serie en cours */
  series: number
  /** Presences dans la serie en cours */
  progress: number
  /** Taille d'une serie (N) */
  size: number
  presences: number
  /** Series terminees non payees */
  dueSeries: number[]
  dueAmount: number
  state: SeriesState
  nextToPay: number | null
  lastPayment: {
    number: number
    paidAt: string
    receiptNumber: number
    receivedBy: PersonName | null
  } | null
}

export interface GroupPayments {
  group: PaymentGroup
  summary: PaymentSummary
  rows: StudentSeries[]
}

/** Dates de presence des eleves d'un groupe, payees ou non. */
export interface GroupSheet {
  group: { id: string; name: string; subject: string; monthlySessions: number }
  month: string | null
  /** Mois ou le groupe a des presences ("AAAA-MM"), du plus ancien au plus recent */
  months: string[]
  rows: {
    student: { id: string; user: PersonName }
    left: boolean
    presences: { sessionId: string; startsAt: string; series: number; paid: boolean }[]
  }[]
}

export interface StudentPayments {
  groups: (StudentSeries & { group: { id: string; name: string; subject: string } })[]
  history: {
    id: string
    number: number
    amount: number
    group: { id: string; name: string; subject: string }
    payment: { paidAt: string; receiptNumber: number } | null
  }[]
}

/** Argent encaisse pendant un mois ("AAAA-MM", heure de Tunis). */
export interface Earnings {
  month: string
  total: number
  count: number
  previousTotal: number
  /** Les 12 derniers mois, le mois choisi en dernier */
  months: { month: string; total: number; count: number }[]
  byGroup: {
    group: { id: string; name: string; subject: string }
    teacher: { id: string; user: PersonName }
    total: number
    count: number
  }[]
  byTeacher: { teacher: { id: string; user: PersonName }; total: number; count: number }[]
  payments: {
    id: string
    amount: number
    paidAt: string
    receiptNumber: number
    receivedBy: PersonName | null
    series: number
    student: { id: string; user: PersonName }
    group: { id: string; name: string; subject: string }
  }[]
}

export interface ExerciseFile {
  id: string
  fileName: string
  mimeType: string
  size: number
}

/** Exercice en fichiers, publie pour des groupes d'un niveau. */
export interface Exercise {
  id: string
  title: string
  description: string | null
  subject: string
  level: string
  createdAt: string
  author: { id: string; user: PersonName }
  attachments: ExerciseFile[]
  groups: { id: string; name: string; subject: string; level: string; section: string }[]
}

export type WhatsappState = 'DISCONNECTED' | 'CONNECTING' | 'QR' | 'CONNECTED'

export interface WhatsappStatus {
  state: WhatsappState
  /** Image (data:) du QR code a scanner */
  qr: string | null
  phone: string | null
  name: string | null
  lastError: string | null
  stats: { pending: number; failed: number; sentToday: number; dailyLimit: number }
  quietHours: { nightStart: number; morning: number }
}

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED'
export type NotificationType = 'absence' | 'payment_reminder' | 'password_reset' | 'test'

export interface WhatsappMessage {
  id: string
  type: NotificationType
  status: NotificationStatus
  content: string
  phone: string | null
  recipient: string | null
  scheduledAt: string
  sentAt: string | null
  attempts: number
  error: string | null
  createdAt: string
  student: { id: string; user: PersonName } | null
}

export interface AttendanceHistory {
  stats: Record<AttendanceStatus, number>
  total: number
  /** Pourcentage (present + retard), absences excusees exclues. */
  rate: number | null
  records: {
    id: string
    status: AttendanceStatus
    note: string | null
    session: { id: string; startsAt: string; group: { name: string; subject: string } }
  }[]
}
