import { Check, PhoneCall, PhoneForwarded } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type AgentLead, type AgentLeadStatus, useAgentLeads, useSetLeadStatus } from '../api/agent.api'
import { AgentInbox } from '../components/AgentInbox'

const STATUS_BADGE = { NEW: 'primary', CALLED: 'warning', DONE: 'success' } as const
const FILTERS: AgentLeadStatus[] = ['NEW', 'CALLED', 'DONE']

/** Les personnes que l'agent n'a pas pu aider : questions, absences et paiements. */
export function AgentLeadsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<AgentLeadStatus | undefined>('NEW')
  const query = useAgentLeads({ page, status })
  const setLead = useSetLeadStatus()

  const action = (lead: AgentLead, next: AgentLeadStatus, label: string, icon: typeof Check) => {
    const Icon = icon
    return (
      <Button
        variant="outline"
        size="sm"
        loading={setLead.isPending && setLead.variables?.id === lead.id}
        onClick={() => setLead.mutate({ id: lead.id, status: next })}
      >
        <Icon />
        {label}
      </Button>
    )
  }

  return (
    <>
      <PageHeader title={t('agent.leadsTitle')} description={t('agent.leadsSubtitle')} />
      <AgentInbox
        title={t('agent.leadsList')}
        empty={t('agent.noLeads')}
        icon={PhoneForwarded}
        filters={FILTERS}
        filter={status}
        onFilter={(f) => {
          setStatus(f)
          setPage(1)
        }}
        statusLabel={(s) => t(`agent.leadStatus.${s}`)}
        query={query}
        page={page}
        onPage={setPage}
        badges={(lead) => (
          <>
            <Badge variant={STATUS_BADGE[lead.status]}>{t(`agent.leadStatus.${lead.status}`)}</Badge>
            <Badge>{t(`agent.reason.${lead.reason}`)}</Badge>
          </>
        )}
        body={(lead) => <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm whitespace-pre-line">{lead.question}</p>}
        actions={(lead) => (
          <>
            {lead.status === 'NEW' && action(lead, 'CALLED', t('agent.markCalled'), PhoneCall)}
            {lead.status !== 'DONE' && action(lead, 'DONE', t('agent.markDone'), Check)}
          </>
        )}
      />
    </>
  )
}
