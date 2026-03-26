import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  Users,
  Target,
  Zap,
  Shield,
  CheckCircle2,
  Play,
  Star,
  ChevronRight,
  Lightbulb,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InteractiveDashboardPreview } from '@/components/landing/InteractiveDashboardPreview';
import { usePreAuth } from '@/contexts/PreAuthContext';
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Next Best Actions',
    description:
      'Get actionable recommendations with confidence scores and impact estimates. Know exactly what to do next.',
  },
  {
    icon: BarChart3,
    title: 'Unified Data Intelligence',
    description:
      'Centralize all your marketing data in one place. No more switching between 10 different tools.',
  },
  {
    icon: Target,
    title: 'Smart Lead Scoring',
    description:
      'AI analyzes fit, intent, and engagement to prioritize your hottest prospects automatically.',
  },
  {
    icon: Lightbulb,
    title: 'Competitive Intelligence',
    description:
      'Monitor competitors, track industry trends, and get alerts on market changes that matter.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Insights',
    description:
      'Decision-grade reporting with key takeaways, not vanity metrics. Know what\'s actually working.',
  },
  {
    icon: MessageSquare,
    title: 'Conversational AI Interface',
    description:
      'Ask questions, get answers, and trigger workflows through natural conversation.',
  },
];

const stats = [
  { value: '47%', label: 'Average increase in qualified leads' },
  { value: '3.2x', label: 'Faster campaign optimization' },
  { value: '12hrs', label: 'Saved per week on reporting' },
  { value: '89%', label: 'Recommendation acceptance rate' },
];

const testimonials = [
  {
    quote:
      "DigiObs transformed how we run marketing. Instead of drowning in dashboards, we now have clear actions every morning.",
    author: 'Sarah Chen',
    role: 'VP of Marketing',
    company: 'Mabsilico',
    avatar: 'SC',
  },
  {
    quote:
      "The AI recommendations are scary accurate. It caught a conversion opportunity we'd been missing for months.",
    author: 'Marcus Johnson',
    role: 'Growth Lead',
    company: 'Nerya',
    avatar: 'MJ',
  },
  {
    quote:
      "Finally, a tool that tells me what to do instead of just showing me more charts. Game changer for our agency.",
    author: 'Emily Watson',
    role: 'Agency Director',
    company: 'Kaptory',
    avatar: 'EW',
  },
];

const integrations = [
  'Google Analytics',
  'HubSpot',
  'LinkedIn Ads',
  'Google Ads',
  'Salesforce',
  'SEMrush',
  'Slack',
  'Zapier',
];

export default function Landing() {
  const { isPreAuthenticated } = usePreAuth();
  const { isAuthenticated } = useAuth();
  const hasDashboardAccess = isPreAuthenticated || isAuthenticated;
  const authRoute = hasDashboardAccess ? '/home' : '/login';
  const authLabel = hasDashboardAccess ? 'Go to Dashboard' : 'Sign In';

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-xl text-foreground">DigiObs</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to={authRoute}>{authLabel}</Link>
            </Button>
            <Button size="sm" className="gap-2" asChild>
              <Link to={authRoute}>
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              AI-Powered Marketing Intelligence
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1] mb-6">
              Stop guessing.
              <br />
              <span className="text-primary">Start knowing.</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              DigiObs is your AI marketing co-pilot that turns scattered data into clear actions.
              Always know what to do next.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="gap-2 h-12 px-8 text-base" asChild>
                <Link to="/dashboard">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="gap-2 h-12 px-8 text-base">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />
            <InteractiveDashboardPreview />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Everything you need to run marketing autonomously
            </h2>
            <p className="text-lg text-muted-foreground">
              DigiObs replaces empty dashboards with unified intelligence, actionable recommendations,
              and an AI layer that actually helps you execute.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-sidebar text-sidebar-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4 bg-sidebar-accent text-sidebar-accent-foreground">
              How it Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              From data chaos to clarity in 3 steps
            </h2>
            <p className="text-lg text-sidebar-foreground/70">
              DigiObs connects to your existing tools and starts delivering value immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Your Tools',
                description:
                  'Integrate with your analytics, CRM, ads, and more in just a few clicks. We support 50+ platforms.',
              },
              {
                step: '02',
                title: 'AI Analyzes Everything',
                description:
                  'Our AI agents continuously monitor your data, identify patterns, and surface what matters most.',
              },
              {
                step: '03',
                title: 'Act on Recommendations',
                description:
                  'Get prioritized Next Best Actions with confidence scores. Execute directly or add to your plan.',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-sidebar-primary/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-sidebar-foreground/70 leading-relaxed">{item.description}</p>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-sidebar-primary/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-8">
            Integrates with tools you already use
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="px-6 py-3 rounded-lg bg-muted/50 text-muted-foreground font-medium text-sm"
              >
                {integration}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Loved by marketing teams
            </h2>
            <p className="text-lg text-muted-foreground">
              See what marketing leaders say about DigiObs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, upgrade when you're ready. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$0',
                period: 'forever',
                description: 'For individuals getting started',
                features: ['1 workspace', '3 integrations', '100 AI recommendations/mo', 'Email support'],
                cta: 'Start Free',
                highlighted: false,
              },
              {
                name: 'Pro',
                price: '$99',
                period: '/month',
                description: 'For growing marketing teams',
                features: [
                  '5 workspaces',
                  'Unlimited integrations',
                  'Unlimited AI recommendations',
                  'Priority support',
                  'Advanced analytics',
                  'Team collaboration',
                ],
                cta: 'Start Free Trial',
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large organizations',
                features: [
                  'Unlimited workspaces',
                  'Custom integrations',
                  'Dedicated AI training',
                  '24/7 support',
                  'SSO & advanced security',
                  'Custom onboarding',
                ],
                cta: 'Contact Sales',
                highlighted: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border ${
                  plan.highlighted
                    ? 'border-primary bg-primary/5 shadow-lg scale-105'
                    : 'border-border bg-card'
                }`}
              >
                {plan.highlighted && (
                  <Badge className="mb-4">Most Popular</Badge>
                )}
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <Link to="/dashboard">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-sidebar text-sidebar-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your marketing?
          </h2>
          <p className="text-xl text-sidebar-foreground/70 mb-10 max-w-2xl mx-auto">
            Join hundreds of marketing teams who stopped guessing and started knowing.
            Your AI marketing co-pilot is waiting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" className="gap-2 h-12 px-8 text-base" asChild>
              <Link to="/dashboard">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 h-12 px-8 text-base border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">D</span>
                </div>
                <span className="font-bold text-xl text-foreground">DigiObs</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered marketing intelligence for teams that want to stop guessing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 DigiObs. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Shield className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
