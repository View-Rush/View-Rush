import React, { useState, useEffect } from 'react';

const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: "AI-Powered Predictions",
      description: "Advanced machine learning algorithms analyze Sri Lankan YouTube trends to predict optimal publishing times",
      icon: "🤖"
    },
    {
      title: "Smart Analytics",
      description: "Leverage curated datasets to understand your audience behavior",
      icon: "📊"
    },
    {
      title: "Localized Insights",
      description: "Tailored specifically for the Sri Lankan market with local trending data and patterns",
      icon: "🇱🇰"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                View Rush
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" onClick={() => scrollToSection('features')} 
                 className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer">
                Features
              </a>
              <a href="#about" onClick={() => scrollToSection('about')} 
                 className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer">
                About
              </a>
              <a href="#contact" onClick={() => scrollToSection('contact')} 
                 className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer">
                Contact
              </a>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 -right-4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className={`relative z-10 max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Optimize Your
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
              YouTube Success
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-light">
            AI-powered platform for Sri Lankan YouTube creators to find optimal video publishing times.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto">
              Start Optimizing Now
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300 w-full sm:w-auto">
              Learn More
            </button>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
          <div className="relative w-64 h-64">
            <div className="absolute top-0 left-8 w-20 h-28 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 animate-bounce"></div>
            <div className="absolute top-16 right-0 w-20 h-28 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 animate-bounce" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-8 left-0 w-20 h-28 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 animate-bounce" style={{animationDelay: '2s'}}></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose View Rush?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Harness the power of AI and data analytics to grow your YouTube channel in the Sri Lankan market
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border-2 ${
                  index === currentFeature ? 'border-purple-500 scale-105' : 'border-transparent'
                }`}
              >
                <div className="text-5xl mb-4 text-center">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold">95%</div>
              <div className="text-lg opacity-90">Accuracy Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold">24/7</div>
              <div className="text-lg opacity-90">API Monitoring</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold">1M+</div>
              <div className="text-lg opacity-90">Data Points</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold">100+</div>
              <div className="text-lg opacity-90">Creators Helped</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Revolutionizing YouTube Creation in Sri Lanka
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                View Rush addresses the unique challenges faced by novice Sri Lankan YouTube creators by providing 
                intelligent, localized tools powered by AI.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our platform analyzes historical videos from the Sri Lankan market to predict optimal 
                publishing times based on your video's metadata, including title, thumbnail, and description.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Predictive modeling for optimal timing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Recommendation system for content strategy</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Sri Lankan market specialization</span>
                </div>
              </div>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                Discover More
              </button>
            </div>
            <div className="relative">
              <div className="relative w-full h-96 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 p-1">
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-4 p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg animate-pulse"></div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg animate-pulse" style={{animationDelay: '1s'}}></div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg animate-pulse" style={{animationDelay: '1.5s'}}></div>
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-500 rounded-lg animate-pulse" style={{animationDelay: '2s'}}></div>
                    <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-orange-500 rounded-lg animate-pulse" style={{animationDelay: '2.5s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Optimize Your YouTube Success?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join Sri Lankan creators who are already using AI to grow their channels
          </p>
          <button className="bg-white text-orange-500 px-10 py-4 rounded-full text-lg font-bold hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                View Rush
              </h3>
              <p className="text-gray-400">
                AI-powered YouTube optimization for Sri Lankan creators
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 View Rush. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
