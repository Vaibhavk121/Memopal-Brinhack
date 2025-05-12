import React from 'react';
import './signup.css';
import './manageaccounts.css';

const ManageAccounts = () => {
    return (
        <div className="manage-container">
            <aside className="manage-sidebar">
                <div className="manage-sidebar-title">Account</div>
                <div className="manage-sidebar-subtitle">Manage your account info.</div>
                <nav className="manage-nav">
                    <div className="manage-nav-item active">
                        <span className="manage-nav-icon">{/* Profile icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#fff" /><rect x="4" y="16" width="16" height="6" rx="3" fill="#fff" /></svg>
                        </span>
                        Profile
                    </div>
                    <div className="manage-nav-item">
                        <span className="manage-nav-icon">{/* Connections icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="7" cy="7" r="3" fill="#fff" /><circle cx="17" cy="17" r="3" fill="#fff" /><path d="M10 10L14 14" stroke="#fff" strokeWidth="2" /></svg>
                        </span>
                        Connections
                    </div>
                </nav>
            </aside>
            <main className="manage-main">
                <div className="manage-card">
                    <div className="manage-card-title">Profile details</div>
                    <div className="manage-table">
                        <div className="manage-table-row manage-table-header">
                            <div>Profile</div>
                            <div></div>
                            <div></div>
                        </div>
                        <div className="manage-table-row">
                            <div className="manage-avatar-cell">
                                <span className="manage-avatar">S</span>
                            </div>
                            <div className="manage-profile-name">Suresh M</div>
                            <div className="manage-update-link">Update profile</div>
                        </div>
                        <div className="manage-table-row manage-table-header">
                            <div>Email address</div>
                            <div></div>
                            <div></div>
                        </div>
                        <div className="manage-table-row">
                            <div className="manage-email">Suresh@gmail.com</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManageAccounts;
