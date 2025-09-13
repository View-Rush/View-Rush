import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Globe, 
  Brain, 
  Clock, 
  BarChart3, 
  Zap,
  Target,
  Users,
  PlayCircle
} from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "Global Trending Analysis",
      description: "Track trending videos across 113 countries in real-time. Discover what's viral before your competition does.",
      badge: "Live Data",
      color: "text-primary"
    },
    {
      icon: Brain,
      title: "AI-Powered Predictions",
      description: "Machine learning algorithms analyze your content patterns to predict optimal publish times and content strategies.",
      badge: "AI Insights",
      color: "text-accent"
    },
    {
      icon: Globe,
      title: "Multi-Country Insights",
      description: "Compare performance across different regions and adapt your content strategy for global audiences.",
      badge: "Global Reach",
      color: "text-info"
    },
    {
      icon: Clock,
      title: "Optimal Timing",
      description: "Get precise recommendations on when to publish your content for maximum engagement and views.",
      badge: "Perfect Timing",
      color: "text-success"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep dive into your channel's performance with comprehensive metrics and visual data representations.",
      badge: "Pro Analytics",
      color: "text-warning"
    },
    {
      icon: Target,
      title: "Audience Targeting",
      description: "Understand your audience demographics and behavior patterns to create more engaging content.",
      badge: "Audience Intel",
      color: "text-destructive"
    }
  ];

  return (
    <section className="py-24 bg-gradient-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Powerful Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Dominate YouTube
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            View Rush combines cutting-edge analytics with AI-powered insights to give you 
            the competitive edge in the YouTube ecosystem.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 bg-background/60 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-gradient-primary/10 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional features showcase */}
        <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Real-Time Data Processing</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Our advanced infrastructure processes millions of data points every minute, 
                ensuring you always have access to the most current trends and insights.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <PlayCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold">1M+</div>
                  <div className="text-sm text-muted-foreground">Videos/Hour</div>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                  <div className="font-semibold">24/7</div>
                  <div className="text-sm text-muted-foreground">Monitoring</div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-gradient-primary/10 rounded-full flex items-center justify-center">
                  <div className="w-48 h-48 bg-gradient-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-primary/30 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-16 w-16 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-12 h-12 bg-success rounded-full flex items-center justify-center animate-pulse">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};