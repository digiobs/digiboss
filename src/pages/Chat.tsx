import { ChatInterface } from '@/components/chat/ChatInterface';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';

export default function Chat() {
  return (
    <div className="space-y-4 animate-fade-in">
      <TabDataStatusBanner tab="chat" />
      <ChatInterface />
    </div>
  );
}
