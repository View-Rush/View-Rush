import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-white">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">VR</span>
              </div>
              <span className="text-3xl font-bold">View Rush</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Optimize Your
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                YouTube Success
              </span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Leverage AI-powered predictions and analytics tailored for Sri Lankan content creators. 
              Maximize your views, engagement, and growth with data-driven insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started Free
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
              >
                Learn More
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-300">95%</div>
                <div className="text-blue-100 text-sm">Prediction Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-300">24/7</div>
                <div className="text-blue-100 text-sm">Real-time Monitoring</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-300">🇱🇰</div>
                <div className="text-blue-100 text-sm">Sri Lanka Focused</div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              {/* Mock Dashboard Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Analytics Dashboard</h3>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-yellow-300 text-sm font-medium">Optimal Upload Time</div>
                    <div className="text-white text-lg font-bold">Today 7:30 PM</div>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-blue-200 text-sm font-medium">Predicted Views</div>
                    <div className="text-white text-lg font-bold">12,500 - 18,000</div>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-green-200 text-sm font-medium">Engagement Score</div>
                    <div className="text-white text-lg font-bold">8.7/10</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
