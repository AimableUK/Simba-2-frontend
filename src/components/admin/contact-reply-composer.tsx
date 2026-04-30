"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { contactApi } from "@/lib/api";

type Contact = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string | null;
  createdAt: string;
  isRead?: boolean;
  isReplied?: boolean;
};

type Props = {
  contact: Contact;
  onSent: () => void;
};

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btn = (action: () => void, active: boolean, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={action}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-background">
      {btn(
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive("bold"),
        <Bold className="h-4 w-4" />,
      )}
      {btn(
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive("italic"),
        <Italic className="h-4 w-4" />,
      )}
      {btn(
        () => editor.chain().focus().toggleUnderline().run(),
        editor.isActive("underline"),
        <UnderlineIcon className="h-4 w-4" />,
      )}
      {btn(
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive("bulletList"),
        <List className="h-4 w-4" />,
      )}
      {btn(
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive("orderedList"),
        <ListOrdered className="h-4 w-4" />,
      )}
      {btn(
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive("blockquote"),
        <Quote className="h-4 w-4" />,
      )}
    </div>
  );
}

export default function ContactReplyComposer({ contact, onSent }: Props) {
  const t = useTranslations("admin.contacts");
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: t("replyPlaceholder") }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-content min-h-[180px] p-4 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const replyMutation = useMutation({
    mutationFn: (message: string) => contactApi.reply(contact.id, { message }),
    onSuccess: () => {
      toast.success(t("replySent"));
      editor?.commands.setContent("");
      onSent();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || t("replyFailed")),
  });

  const handleSend = () => {
    const html = editor?.getHTML()?.trim() || "";
    const text = editor?.getText()?.trim() || "";

    if (!text || html === "<p></p>") {
      toast.error(t("replyRequired"));
      return;
    }

    replyMutation.mutate(html);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium">{t("replyTo")}</p>
          <p className="text-sm text-muted-foreground">
            {contact.name} - {contact.email}
          </p>
        </div>

        <div className="p-4 border-b border-border bg-muted/20">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            {t("originalMessage")}
          </p>
          <p className="text-sm font-medium mb-2">{contact.subject}</p>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {contact.message}
          </div>
        </div>

        <div>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t("replyTitle")}</p>
              <p className="text-xs text-muted-foreground">
                {t("replySubtitle")}
              </p>
            </div>
            {contact.isReplied ? (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {t("replied")}
              </span>
            ) : null}
          </div>

          {!mounted ? (
            <div className="min-h-[180px] p-4 text-sm text-muted-foreground flex items-center">
              {t("loadingEditor")}
            </div>
          ) : (
            <>
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSend}
          disabled={replyMutation.isPending}
          className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Send className="h-4 w-4" />
          {replyMutation.isPending ? t("sendingReply") : t("sendReply")}
        </button>
      </div>
    </div>
  );
}
