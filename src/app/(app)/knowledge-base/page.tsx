import AgentKnowledgeBase from "@/components/knowledge-base/AgentKnowledgeBase";

// Revalidate every 5 minutes (knowledge base data)
export const revalidate = 300;

export default function Page() {
  return (
    <>
      <AgentKnowledgeBase />
    </>
  );
}
