// Ce que l'enseignant et l'eleve voient d'un exercice (partage entre les acteurs).

export const exerciseSelect = {
  id: true,
  title: true,
  description: true,
  subject: true,
  level: true,
  createdAt: true,
  author: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  attachments: {
    select: { id: true, fileName: true, mimeType: true, size: true },
    orderBy: { createdAt: 'asc' },
  },
  assignments: {
    where: { groupId: { not: null } },
    select: { group: { select: { id: true, name: true, subject: true, level: true, section: true } } },
  },
} as const;

type Row = {
  assignments: { group: { id: string; name: string; subject: string; level: string; section: string } | null }[];
};

/** assignments[] -> groups[] */
export function flatten<T extends Row>({ assignments, ...rest }: T) {
  return { ...rest, groups: assignments.flatMap((a) => (a.group ? [a.group] : [])) };
}
