// Admin Contacts Page
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { MailOpen, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { contactApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/common/skeletons';
import { Pagination } from '@/components/common/pagination';
import { useAdminSocket } from '@/hooks/useSocket';

const ContactReplyComposer = dynamic(
  () => import('@/components/admin/contact-reply-composer'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground min-h-[240px] flex items-center">
        Loading reply editor...
      </div>
    ),
  },
);

type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  isReplied: boolean;
};

export default function AdminContactsPage() {
  const qc = useQueryClient();
  const t = useTranslations('admin.contacts');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);

  useAdminSocket({
    onNewContact: () => qc.invalidateQueries({ queryKey: ['admin-contacts'] }),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-contacts', page, filter],
    queryFn: () =>
      contactApi.adminList({ page, limit: 20, read: filter }).then((r) => r.data),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => contactApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Failed to update message'),
  });

  const unread = data?.data?.filter((c: Contact) => !c.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {unread > 0 && (
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
            {unread} {t('new')}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {[
          { label: t('filters.all'), value: '' },
          { label: t('filters.unread'), value: 'false' },
          { label: t('filters.read'), value: 'true' },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              filter === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['', t('cols.name'), t('cols.email'), t('cols.subject'), t('cols.date'), t('cols.actions')].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={6} />
                  ))
                : data?.data?.map((contact: Contact) => (
                    <tr
                      key={contact.id}
                      className={`border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${
                        !contact.isRead ? 'bg-primary/3' : ''
                      }`}
                      onClick={() => {
                        setSelected(contact);
                        if (!contact.isRead) markReadMutation.mutate(contact.id);
                      }}
                    >
                      <td className="px-4 py-3">
                        {!contact.isRead ? (
                          <Mail className="h-4 w-4 text-primary" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{contact.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {contact.email}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[200px]">
                        {contact.subject}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(contact.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(contact);
                          }}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          {t('view')}
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage}
      />

      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4 gap-4">
              <div>
                <h2 className="font-bold text-lg">{selected.subject}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selected.name} - {selected.email}
                </p>
                {selected.phone && (
                  <p className="text-sm text-muted-foreground">{selected.phone}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selected.isReplied && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {t('replied')}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(selected.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label={t('close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {selected.message}
            </div>

            <div className="mt-6">
              <ContactReplyComposer
                contact={selected}
                onSent={() => {
                  qc.invalidateQueries({ queryKey: ['admin-contacts'] });
                  setSelected(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
