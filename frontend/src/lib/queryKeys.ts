export const queryKeys = {
  me: ['me'] as const,
  members: ['members'] as const,

  patients: {
    list:      (page: number, query = '') => ['patients', 'list', page, query] as const,
    detail:    (id: string)   => ['patients', id] as const,
    history:   (id: string, page: number) => ['patients', id, 'history', page] as const,
    myRecords: (id: string, page: number) => ['patients', id, 'my-records', page] as const,
  },

  interpreters: {
    list:   (page: number, query = '') => ['interpreters', 'list', page, query] as const,
    detail: (id: string)   => ['interpreters', id] as const,
  },

  consultations: {
    list:      (page: number)                    => ['consultations', 'list', page] as const,
    detail:    (id: string)                      => ['consultations', id] as const,
    byPatient: (patientId: string, page: number) => ['consultations', 'patient', patientId, page] as const,
  },

  handovers: {
    byPatient: (patientId: string, page: number) => ['handovers', 'patient', patientId, page] as const,
  },

  matching: {
    list:      (page: number)     => ['matching', 'list', page] as const,
    byPatient: (patientId: string) => ['matching', 'patient', patientId] as const,
  },

  scripts: {
    byPatient: (patientId: string, page: number) => ['scripts', 'patient', patientId, page] as const,
    detail:    (id: string) => ['scripts', id] as const,
  },

  hospitals: {
    search: (name: string | undefined, page: number) => ['hospitals', 'search', name, page] as const,
  },
}
