'use client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Heart, MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { blogApi } from '@/lib/api';
import { formatDate, getImageUrl, truncate } from '@/lib/utils';
import { BlogCardSkeleton } from '@/components/common/skeletons';
import { Pagination } from '@/components/common/pagination';
import type { Blog } from '@/types';

export default function BlogPage() {
  const t = useTranslations('blog');
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['blogs', page, search],
    queryFn: () => blogApi.list({ page, limit: 9, search }).then((r) => r.data),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/5 border-b border-border py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t('title')}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">{t('subtitle')}</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <button onClick={() => { setSearch(searchInput); setPage(1); }} className="bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <BlogCardSkeleton key={i} />)}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t('noBlogs')}</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data?.map((blog: Blog) => (
                <Link key={blog.id} href={`/${locale}/blog/${blog.slug}`} className="group block">
                  <article className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                    {blog.image && (
                      <div className="relative h-48 overflow-hidden">
                        <Image src={getImageUrl(blog.image)} alt={blog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
                      </div>
                    )}
                    <div className="p-5">
                      {blog.tags?.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mb-3">
                          {blog.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{tag}</span>
                          ))}
                        </div>
                      )}
                      <h2 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">{blog.title}</h2>
                      {blog.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{blog.excerpt}</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{blog.authorName} · {formatDate(blog.createdAt)}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{blog.viewCount}</span>
                          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{(blog as any)._count?.likes || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{(blog as any)._count?.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
            <Pagination page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} className="mt-12" />
          </>
        )}
      </div>
    </div>
  );
}
