'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Plus, Edit, Trash2, X, Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Quote, Eye, EyeOff, Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { blogApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/common/skeletons';
import { Pagination } from '@/components/common/pagination';
import type { Blog } from '@/types';

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  const btn = (action: () => void, active: boolean, icon: React.ReactNode) => (
    <button type="button" onClick={action}
      className={`p-2 rounded-lg transition-colors ${active ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
      {icon}
    </button>
  );
  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border">
      {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), <Bold className="h-4 w-4" />)}
      {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), <Italic className="h-4 w-4" />)}
      {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), <UnderlineIcon className="h-4 w-4" />)}
      {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), <List className="h-4 w-4" />)}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), <ListOrdered className="h-4 w-4" />)}
      {btn(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), <Quote className="h-4 w-4" />)}
      {['h2','h3'].map(h => (
        <button key={h} type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: parseInt(h[1]) }).run()}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${editor.isActive('heading',{level:parseInt(h[1])}) ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}>
          {h.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function AdminBlogsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [image, setImage] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit, Underline, Link.configure({ openOnClick: false }),
      Image, Placeholder.configure({ placeholder: 'Write your blog post here...' }),
    ],
    content: '',
    editorProps: {
      attributes: { class: 'tiptap-content min-h-[200px] p-4 focus:outline-none' },
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blogs', page],
    queryFn: () => blogApi.adminList({ page, limit: 15 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => blogApi.create(data),
    onSuccess: () => { toast.success('Blog post created!'); closeForm(); qc.invalidateQueries({ queryKey: ['admin-blogs'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blogApi.update(id, data),
    onSuccess: () => { toast.success('Blog post updated!'); closeForm(); qc.invalidateQueries({ queryKey: ['admin-blogs'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogApi.delete(id),
    onSuccess: () => { toast.success('Blog post deleted'); qc.invalidateQueries({ queryKey: ['admin-blogs'] }); },
  });

  const openEdit = (blog: Blog) => {
    setEditing(blog);
    setTitle(blog.title);
    setExcerpt(blog.excerpt || '');
    setImage(blog.image || '');
    setTags(blog.tags.join(', '));
    setIsPublished(blog.isPublished);
    editor?.commands.setContent(blog.content);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setTitle(''); setExcerpt(''); setImage(''); setTags(''); setIsPublished(false);
    editor?.commands.setContent('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !editor?.getHTML()) return;
    const payload = {
      title, excerpt, image,
      content: editor.getHTML(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isPublished,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm">
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Title', 'Author', 'Tags', 'Views', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                : data?.data?.map((blog: Blog) => (
                  <tr key={blog.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{blog.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{blog.authorName}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {blog.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{blog.viewCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${blog.isPublished ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {blog.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(blog.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(blog)} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary"><Edit className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteMutation.mutate(blog.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={data?.pagination?.totalPages || 1} onPageChange={setPage} />

      {/* Blog Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={closeForm}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-3xl my-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">{editing ? 'Edit Blog Post' : 'New Blog Post'}</h2>
              <button onClick={closeForm} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Excerpt</label>
                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cover Image URL</label>
                  <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tags (comma separated)</label>
                  <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="recipe, news, tips"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* TipTap editor */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Content *</label>
                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <EditorToolbar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                <span className="text-sm font-medium">Publish immediately (visible to public)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}
                </button>
                <button type="button" onClick={closeForm} className="px-5 py-3 border border-border rounded-xl hover:bg-muted transition-colors font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
