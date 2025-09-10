import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showCard?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title = "Welcome Back",
  subtitle = "Sign in to optimize your YouTube success",
  showCard = true
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {showCard ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">VR</span>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  View Rush
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </div>
            
            {children}
          </div>
        ) : (
          <>
            {/* Header for no-card layout */}
            {(title || subtitle) && (
              <div className="text-center mb-8">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">VR</span>
                  </div>
                  <span className="text-3xl font-bold text-white">
                    View Rush
                  </span>
                </div>
                {title && (
                  <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-blue-100 text-lg">{subtitle}</p>
                )}
              </div>
            )}
            {children}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
