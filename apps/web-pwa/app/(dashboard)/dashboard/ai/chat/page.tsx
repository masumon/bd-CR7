import { redirect } from "next/navigation";

// Redirect to parent AI page — chat is now handled by the floating ChatWidget
export default function AiChatPage() {
  redirect("/dashboard/ai");
}
