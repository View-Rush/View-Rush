import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-gradient-hero relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* CTA badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 mb-8">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-white font-medium">
              Join 2,000+ YouTube Creators
            </span>
          </div>

          {/* Main CTA heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your
            <span className="block">YouTube Strategy?</span>
          </h2>

          {/* CTA description */}
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Start your free analysis today and discover the insights that will 
            accelerate your channel growth. No credit card required.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-10 py-5 bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-10 py-5 bg-transparent border-white/40 text-white hover:bg-white/10 backdrop-blur-sm"
              onClick={() => navigate('/auth')}
            >
              Book a Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="text-white/80 space-y-2">
            <p className="text-sm">✓ 7-day free trial • ✓ No setup fees • ✓ Cancel anytime</p>
            <p className="text-xs">Trusted by creators islandwide</p>
          </div>
        </div>
      </div>
    </section>
  );
};