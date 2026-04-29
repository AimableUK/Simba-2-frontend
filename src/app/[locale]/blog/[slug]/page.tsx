"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Eye,
  Trash2,
  ArrowLeft,
  Calendar,
  User,
  MoveLeft,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { blogApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { formatDateTime, getImageUrl } from "@/lib/utils";
import { Skeleton } from "@/components/common/skeletons";

export default function BlogDetailPage() {
  const t = useTranslations("blog");
  const locale = useLocale();
  const { slug } = useParams();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => blogApi.get(slug as string).then((r) => r.data),
  });

  const likeMutation = useMutation({
    mutationFn: () => blogApi.like(blog!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog", slug] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => blogApi.addComment(blog!.id, comment),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["blog", slug] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to post comment"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      blogApi.deleteComment(blog!.id, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog", slug] }),
  });

  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 rounded-2xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );

  if (!blog)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Post not found</p>
        <Link
          href={`/${locale}/blog`}
          className="whitespace-nowrap mt-4 inline-block text-primary hover:underline"
        >
          <MoveLeft /> {t("title")}
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> {t("title")}
        </Link>

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {blog.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
          {blog.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {blog.authorName}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDateTime(blog.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {t("views", { count: blog.viewCount })}
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="h-4 w-4" />
            {t("likes", { count: blog._count?.likes || 0 })}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            {t("comments", { count: blog._count?.comments || 0 })}
          </span>
        </div>

        {/* Cover Image */}
        {blog.image && (
          <div className="relative aspect-[2/1] rounded-2xl overflow-hidden mb-8">
            <Image
              src={getImageUrl(blog.image)}
              alt={blog.title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div
          className="tiptap-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Like button */}
        <div className="flex items-center gap-4 mt-10 pt-8 border-t border-border">
          <button
            onClick={() => {
              if (!session?.user) {
                toast.error("Sign in to like posts");
                return;
              }
              likeMutation.mutate();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all font-medium text-sm ${
              blog.likedByMe
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/40 hover:bg-muted"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${blog.likedByMe ? "fill-primary" : ""}`}
            />
            {blog.likedByMe ? "Liked" : "Like"} · {blog._count?.likes || 0}
          </button>
        </div>

        {/* Comments */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-6">
            {t("comments")} ({blog._count?.comments || 0})
          </h2>

          {/* Comment form */}
          {session?.user ? (
            <div className="mb-8">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("commentPlaceholder")}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
              />
              <button
                onClick={() => comment.trim() && commentMutation.mutate()}
                disabled={!comment.trim() || commentMutation.isPending}
                className="mt-2 bg-primary text-primary-foreground font-medium px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
              >
                {commentMutation.isPending ? "Posting..." : t("submitComment")}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              <Link
                href={`/${locale}/auth/sign-in`}
                className="text-primary hover:underline"
              >
                Sign in
              </Link>{" "}
              {t("loginToComment").replace("Sign in to comment", "to comment")}
            </p>
          )}

          {/* Comment list */}
          <div className="space-y-4">
            {blog.comments?.map((c: any) => (
              <div
                key={c.id}
                className="bg-muted/30 border border-border rounded-2xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                      {c.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.user?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(c.createdAt)}
                      </p>
                    </div>
                  </div>
                  {(session?.user?.id === c.userId ||
                    ["admin", "super_admin"].includes(
                      (session?.user as any)?.role,
                    )) && (
                    <button
                      onClick={() => deleteCommentMutation.mutate(c.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/90">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
