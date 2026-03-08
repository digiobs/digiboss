import { HomeGreeting } from '@/components/home/HomeGreeting';
import { HomeAlertBar } from '@/components/home/HomeAlertBar';
import { HomeKPICards } from '@/components/home/HomeKPICards';
import { HomeNBASection } from '@/components/home/HomeNBASection';
import { HomeCalendarWeek } from '@/components/home/HomeCalendarWeek';
import { HomeClientHealth } from '@/components/home/HomeClientHealth';
import { HomeActivityFeed } from '@/components/home/HomeActivityFeed';

export default function Home() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <HomeGreeting />

      {/* Alert Bar */}
      <HomeAlertBar />

      {/* KPIs */}
      <HomeKPICards />

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: NBA + Calendar (60%) */}
        <div className="lg:col-span-7 space-y-6">
          <HomeNBASection />
          <HomeCalendarWeek />
        </div>

        {/* Right: Health + Feed (40%) */}
        <div className="lg:col-span-5 space-y-6">
          <HomeClientHealth />
          <HomeActivityFeed />
        </div>
      </div>
    </div>
  );
}
