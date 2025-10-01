import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Globe, 
  Brain, 
  Clock, 
  BarChart3, 
  Zap,
  Target,
  Users,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Eye,
  Activity
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Features = () => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const features = [
    {
      icon: TrendingUp,
      title: "Global Trending Analysis",
      description: "Track trending videos across 113 countries in real-time. Discover what's viral before your competition does.",
      badge: "Live Data",
      color: "text-primary",
      bgColor: "bg-primary/10",
      hoverBg: "group-hover:bg-primary/20",
      stats: "2M+ videos analyzed daily",
      link: "/trending"
    },
    {
      icon: Brain,
      title: "AI-Powered Predictions",
      description: "Machine learning algorithms analyze your content patterns to predict optimal publish times and content strategies.",
      badge: "AI Insights",
      color: "text-accent",
      bgColor: "bg-accent/10",
      hoverBg: "group-hover:bg-accent/20",
      stats: "97% accuracy rate",
      link: "/analytics"
    },
    {
      icon: Globe,
      title: "Multi-Country Insights",
      description: "Compare performance across different regions and adapt your content strategy for global audiences.",
      badge: "Global Reach",
      color: "text-info",
      bgColor: "bg-info/10",
      hoverBg: "group-hover:bg-info/20",
      stats: "113 countries tracked",
      link: "/analytics"
    },
    {
      icon: Clock,
      title: "Optimal Timing",
      description: "Get precise recommendations on when to publish your content for maximum engagement and views.",
      badge: "Perfect Timing",
      color: "text-success",
      bgColor: "bg-success/10",
      hoverBg: "group-hover:bg-success/20",
      stats: "3x better engagement",
      link: "/dashboard"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep dive into your channel's performance with comprehensive metrics and visual data representations.",
      badge: "Pro Analytics",
      color: "text-warning",
      bgColor: "bg-warning/10",
      hoverBg: "group-hover:bg-warning/20",
      stats: "50+ metrics tracked",
      link: "/analytics"
    },
    {
      icon: Target,
      title: "Audience Targeting",
      description: "Understand your audience demographics and behavior patterns to create more engaging content.",
      badge: "Audience Intel",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      hoverBg: "group-hover:bg-destructive/20",
      stats: "Deep audience insights",
      link: "/profile"
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
              className="group relative p-6 bg-background/60 backdrop-blur-sm border border-border/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer overflow-hidden hover:border-primary/30"
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
              onClick={() => navigate(feature.link)}
            >
              {/* Background gradient effect */}
              <div className={`absolute inset-0 ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Sparkle animation */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110">
                <Sparkles className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform duration-300" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start space-x-4 mb-4">
                  <div className={`relative p-3 rounded-xl ${feature.bgColor} ${feature.hoverBg} group-hover:scale-110 transition-all duration-500 group-hover:rotate-6 overflow-hidden`}>
                    <feature.icon className={`h-6 w-6 ${feature.color} transition-all duration-300 group-hover:scale-110`} />
                    
                    {/* Smooth glow effect instead of ping */}
                    <div className={`absolute inset-0 rounded-xl ${feature.bgColor} opacity-0 group-hover:opacity-30 transition-all duration-500 group-hover:scale-110`} />
                    
                    {/* Ripple effect on hover */}
                    <div className={`absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-current opacity-0 group-hover:opacity-20 transition-all duration-300 group-hover:scale-125`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs group-hover:scale-105 transition-transform duration-300">
                        {feature.badge}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-4 group-hover:text-foreground/80 transition-colors duration-300">
                  {feature.description}
                </p>
                
                {/* Stats and CTA */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span className="group-hover:text-primary transition-colors duration-300">
                      {feature.stats}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-primary opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <span className="text-sm font-medium">Explore</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Enhanced Real-Time Data Processing showcase */}
        <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 group">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-success rounded-full opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300"></div>
                <Badge variant="outline" className="border-success/50 text-success group-hover:border-success group-hover:bg-success/10 transition-all duration-300">
                  <Activity className="h-3 w-3 mr-1" />
                  Live Processing
                </Badge>
              </div>
              
              <h3 className="text-2xl lg:text-3xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                Real-Time Data Processing
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
                Our advanced infrastructure processes millions of data points every minute, 
                ensuring you always have access to the most current trends and insights.
              </p>
              
              {/* Enhanced stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group/stat text-center p-6 bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
                  <div className="relative">
                    <PlayCircle className="h-10 w-10 text-primary mx-auto mb-3 group-hover/stat:scale-110 transition-transform duration-300" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full opacity-80 group-hover/stat:opacity-100 transition-opacity duration-300 group-hover/stat:scale-125"></div>
                  </div>
                  <div className="font-bold text-xl mb-1 group-hover/stat:text-primary transition-colors duration-300">100K+</div>
                  <div className="text-sm text-muted-foreground">Videos/Hour</div>
                  <div className="text-xs text-primary mt-1 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +5% this week
                  </div>
                </div>
                
                <div className="group/stat text-center p-6 bg-accent/5 hover:bg-accent/10 rounded-xl border border-accent/20 hover:border-accent/40 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-1">
                  <div className="relative">
                    <Users className="h-10 w-10 text-accent mx-auto mb-3 group-hover/stat:scale-110 transition-transform duration-300" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full opacity-80 group-hover/stat:opacity-100 transition-opacity duration-300 group-hover/stat:scale-125"></div>
                  </div>
                  <div className="font-bold text-xl mb-1 group-hover/stat:text-accent transition-colors duration-300">24/7</div>
                  <div className="text-sm text-muted-foreground">Monitoring</div>
                  <div className="text-xs text-accent mt-1 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300">
                    <Eye className="h-3 w-3 inline mr-1" />
                    99.9% uptime
                  </div>
                </div>
              </div>
              
              {/* CTA Button */}
              <Button 
                className="w-full sm:w-auto group/btn"
                onClick={() => navigate('/auth')}
              >
                <span>Start Real-Time Analysis</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
            
            {/* Enhanced visualization */}
            <div className="flex justify-center">
              <div className="relative group/viz">
                {/* Main circles with enhanced animations */}
                <div className="w-72 h-72 bg-gradient-primary/10 rounded-full flex items-center justify-center group-hover/viz:scale-105 transition-all duration-700 relative">
                  <div className="w-56 h-56 bg-gradient-primary/20 rounded-full flex items-center justify-center group-hover/viz:rotate-12 transition-all duration-700">
                    <div className="w-40 h-40 bg-gradient-primary/30 rounded-full flex items-center justify-center group-hover/viz:scale-110 transition-all duration-700">
                      <BarChart3 className="h-20 w-20 text-primary group-hover/viz:rotate-6 transition-all duration-700" />
                    </div>
                  </div>
                  
                  {/* Floating elements with smooth hover animations */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-success rounded-full flex items-center justify-center shadow-lg shadow-success/30 group-hover/viz:scale-110 group-hover/viz:shadow-success/50 transition-all duration-500">
                    <TrendingUp className="h-6 w-6 text-white group-hover/viz:rotate-12 transition-transform duration-500" />
                  </div>
                  
                  <div className="absolute bottom-8 left-8 w-10 h-10 bg-info rounded-full flex items-center justify-center shadow-lg shadow-info/30 group-hover/viz:scale-110 group-hover/viz:-translate-y-1 transition-all duration-700">
                    <Globe className="h-5 w-5 text-white group-hover/viz:rotate-180 transition-transform duration-700" />
                  </div>
                  
                  <div className="absolute top-1/2 left-2 w-8 h-8 bg-warning rounded-full flex items-center justify-center shadow-lg shadow-warning/30 group-hover/viz:scale-125 group-hover/viz:shadow-warning/50 transition-all duration-300">
                    <Brain className="h-4 w-4 text-white group-hover/viz:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                
                {/* Orbiting elements with controlled animation */}
                <div className="absolute inset-0 group-hover/viz:animate-spin-slow transition-all duration-1000 group-hover/viz:duration-8000">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50 group-hover/viz:scale-110 transition-all duration-300">
                      <Sparkles className="h-3 w-3 text-white group-hover/viz:rotate-45 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};