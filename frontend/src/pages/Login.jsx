import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import '../styles/Login.css';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isSignUp && !name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isSignUp) {
        response = await api.register(name, email, password);
      } else {
        response = await api.login(email, password);
      }

      if (response && response.success && response.data) {
        localStorage.setItem('xenoreach_user', JSON.stringify({ 
          email: response.data.email, 
          name: response.data.name,
          token: response.data.token,
          provider: 'email'
        }));
        navigate('/dashboard');
      } else {
        setError(response?.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = () => {
    localStorage.setItem('xenoreach_user', JSON.stringify({ email: 'sso.user@company.com', name: 'Demo User' }));
    navigate('/dashboard');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="login-container">
      {/* Left Side: Login Form */}
      <div className="login-form-side">
        {/* Logo */}
        <div className="login-logo-container">
          <div className="login-logo-box">
            <svg className="login-logo-svg" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <span className="login-logo-text">XenoReach AI</span>
        </div>

        {/* Header */}
        <div className="login-header-group">
          <h1 className="font-headline-lg login-title">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="login-subtitle">
            {isSignUp ? 'Get started with your AI-native CRM' : 'Enter your credentials to access your marketing CRM'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="login-error-box">
            <span className="material-symbols-outlined login-error-icon">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                className="form-input" 
                type="text" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              className="form-input" 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group login-form-group-relative">
            <div className="login-password-label-row">
              <label className="form-label login-password-label">Password</label>
              {!isSignUp && <a href="#forgot" className="login-forgot-link">Forgot password?</a>}
            </div>
            <div className="login-password-input-wrapper">
              <input 
                className="form-input" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-password-toggle"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button className="btn btn-primary ai-glow login-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider-container">
          <div className="login-divider-line"></div>
          <span className="login-divider-text">Or continue with</span>
        </div>

        {/* Social Logins */}
        <div className="login-social-grid">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              const payloadBase64 = credentialResponse.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
              const decoded = JSON.parse(atob(payloadBase64));
              
              const response = await api.googleLogin(
                credentialResponse.credential
              );
            
              localStorage.setItem(
                'xenoreach_user',
                JSON.stringify({
                  ...response.data,
                  provider: 'google',
                  picture: decoded?.picture || null
                })
              );
            
              navigate('/dashboard');
            } catch (err) {
              console.error(err);
              setError('Google login failed');
            }
          }}
          onError={() => {
            setError('Google login failed');
          }}
        />
      </div>

        {/* Footer */}
        <p className="login-footer-text">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button" 
            onClick={toggleMode} 
            className="login-toggle-btn"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      {/* Right Side: Brand Section */}
      <div className="login-brand-side hide-tablet">
        <div className="login-brand-content">
          {/* Floating Graphic Component */}
          <div className="animate-subtle-float login-brand-graphic-container">
            <div className="login-brand-glow-bg"></div>
            <div className="ai-glow-elevation login-brand-card">
              <div className="login-brand-grid">
                <div className="login-brand-icon-wrapper">
                  <span className="material-symbols-outlined login-brand-icon">monitoring</span>
                </div>
                <div className="login-brand-icon-wrapper purple-bg">
                  <span className="material-symbols-outlined login-brand-icon-white">smart_toy</span>
                </div>
                <div className="login-brand-icon-wrapper violet-bg">
                  <span className="material-symbols-outlined login-brand-icon-white">auto_awesome</span>
                </div>
              </div>
              <div className="login-brand-dots-container">
                <div className="login-brand-skeleton-line-long"></div>
                <div className="login-brand-skeleton-line-short"></div>
              </div>
            </div>
          </div>

          {/* Value Prop */}
          <h2 className="login-brand-title">
            Supercharge your marketing with AI-native insights.
          </h2>
          <p className="login-brand-subtitle">
            Join over 2,500+ teams using XenoReach to automate their workflows and drive 3x more engagement.
          </p>

          {/* Testimonial */}
          <div className="login-testimonial-container">
            <div className="login-stars-container">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className="material-symbols-outlined login-star-icon" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
            <p className="login-testimonial-text">
              "The most intuitive CRM we've ever used."
            </p>
            <p className="login-testimonial-author">
              — CMO, TechScale Global
            </p>
          </div>
        </div>

        {/* Atmospheric Blur elements */}
        <div className="login-ambient-glow-top"></div>
        <div className="login-ambient-glow-bottom"></div>
      </div>
    </div>
  );
};

export default Login;
