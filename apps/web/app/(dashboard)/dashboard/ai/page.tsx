import { Bot, Sparkles, Zap } from "lucide-react";

export default function DashboardAiPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/30">
        <Bot className="h-10 w-10 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">SUMONIX AI</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          আপনার স্মার্ট ERP সহকারী। নিচের ডানে ভাসমান বাটনে ক্লিক করে চ্যাট শুরু করুন।
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-left">
          <Zap className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-foreground">বাংলা + ইংরেজি</p>
            <p className="text-[11px] text-muted-foreground">দুই ভাষায় কথা বলুন</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-left">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-foreground">ERP ডাটা বিশ্লেষণ</p>
            <p className="text-[11px] text-muted-foreground">খরচ, প্রজেক্ট, শ্রমিক সম্পর্কে জিজ্ঞেস করুন</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-left">
          <Bot className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <p className="text-xs font-medium text-foreground">Flirt Mode ❤️</p>
            <p className="text-[11px] text-muted-foreground">মজাদার কথোপকথন মোড</p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        নিচের ডানে 🤖 আইকনে ক্লিক করুন → চ্যাট শুরু হবে
      </p>
    </div>
  );
}
