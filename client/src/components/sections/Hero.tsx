import { Button } from "@/components/ui/button";
import { ArrowRight, Play, TrendingUp, Users, BarChart3 } from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Hero badge */}
          <div className="inline-flex items-center space-x-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-8">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              #1 YouTube Analytics Platform
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Master Your
            <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              YouTube Growth
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Unlock the power of data-driven YouTube success. Get AI-powered insights, 
            trending analysis across 113 countries, and optimal publish time predictions 
            to skyrocket your channel growth.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4">
              Start Free Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">113</div>
              <div className="text-white/80">Countries Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">10M+</div>
              <div className="text-white/80">Videos Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-white/80">Creators Trust Us</div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm">
              <img 
                src={heroDashboard}
                alt="View Rush Analytics Dashboard"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            {/* Floating feature cards */}
            <div className="absolute -top-4 -left-4 sm:-left-8 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-primary p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Real-time Analytics</div>
                  <div className="text-sm text-muted-foreground">Live trending data</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 sm:-right-8 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-primary p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">AI Predictions</div>
                  <div className="text-sm text-muted-foreground">Optimal timing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};