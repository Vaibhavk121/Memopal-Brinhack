import React from 'react';
import { Link } from 'react-router-dom';
import './signup.css';
import signUp from '../assets/images/signUp.svg';
import logo from '../assets/images/logo.png';

const Signup = () => {
    return (
        <div className="signup-container">
            <div className="signup-card">
                <div className="signup-form-section">
                    <div className="signup-logo">
                        <Link to="/">
                            <img src={logo} alt="Logo" style={{ width: 48, height: 48 }} />
                        </Link>
                    </div>
                    <h2 className="signup-title">Create your account</h2>
                    <p className="signup-subtitle">Welcome! Please fill in the details to get started.</p>
                    <form className="signup-form">
                        <label className="signup-label" htmlFor="email">Email address</label>
                        <input className="signup-input" type="email" id="email" placeholder="Enter your email address" />
                        <label className="signup-label" htmlFor="password">Password</label>
                        <input className="signup-input" type="password" id="password" placeholder="Enter your Password" />
                        <div className="faceid-box">
                            <button type="button" className="faceid-btn">
                                <span className="faceid-icon-large">
                                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="cameraGradientLarge" x1="6" y1="12" x2="34" y2="28" gradientUnits="userSpaceOnUse">
                                                <stop stopColor="#00c6fb" />
                                                <stop offset="1" stopColor="#0a4e7a" />
                                            </linearGradient>
                                        </defs>
                                        <rect x="6" y="12" width="28" height="16" rx="3" fill="url(#cameraGradientLarge)" />
                                        <circle cx="20" cy="20" r="5" fill="#fff" />
                                        <rect x="14" y="7" width="12" height="5" rx="2.5" fill="url(#cameraGradientLarge)" />
                                    </svg>
                                </span>
                                <span className="faceid-label">Sign up with Face ID</span>
                            </button>
                        </div>
                        <button className="signup-continue-btn" type="submit">Continue</button>
                    </form>
                    <div className="signup-signin-link">
                        Already have an account? <Link to="/signin" className="signup-link">Sign In</Link>
                    </div>
                </div>
                <div className="signup-illustration-section">
                    <img src={signUp} alt="Illustration" className="signup-illustration-img" />
                </div>
            </div>
        </div>
    );
};

export default Signup;
