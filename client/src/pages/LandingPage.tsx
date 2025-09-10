import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/landing_components/HeroSection';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: "AI-Powered Predictions",
      description: "Advanced machine learning algorithms analyze Sri Lankan YouTube trends to predict optimal publishing times with 95% accuracy",
      icon: "🤖",
      color: "from-blue-500 to-purple-600"
    },
    {
      title: "Smart Analytics", 
      description: "Leverage YouTube Data API V3 and curated datasets to understand your audience behavior and engagement patterns",
      icon: "📊",
      color: "from-green-500 to-blue-600"
    },
    {
      title: "Localized Insights",
      description: "Tailored specifically for the Sri Lankan market with real-time trending data and cultural context analysis",
      icon: "🇱🇰",
      color: "from-orange-500 to-red-600"
    },
    {
      title: "Content Optimization",
      description: "Get personalized recommendations for titles, descriptions, and thumbnails based on trending patterns",
      icon: "✨",
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Real-time Monitoring",
      description: "24/7 tracking of YouTube trends and algorithm changes to keep your strategy up-to-date",
      icon: "📡",
      color: "from-indigo-500 to-cyan-600"
    },
    {
      title: "Performance Analytics",
      description: "Comprehensive dashboard showing your channel growth, engagement metrics, and optimization results",
      icon: "📈",
      color: "from-teal-500 to-green-600"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools and insights designed specifically for Sri Lankan YouTube creators
            </p>
          </div>

          <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 ${
                  currentFeature === index ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setCurrentFeature(index)}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Optimize Your YouTube Success?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of Sri Lankan creators who are already maximizing their potential
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Your Free Trial
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
