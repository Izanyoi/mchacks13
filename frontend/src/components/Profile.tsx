import React, { useState } from 'react';
import { User } from '../types'; 
import { User as UserIcon, Mail, Users, Edit2, X, Check } from 'lucide-react';
import { editName, editEmail } from '../services/auth';

interface ProfileProps {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

function Profile(props: ProfileProps) {
    const { user } = props;
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.full_name || '');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [emailError, setEmailError] = useState('');

    const handleSaveName = async () => {
        const token = localStorage.getItem('token');
        if (token && newName) {
            try {
                await editName(token, newName);
                props.setUser(prev => prev ? { ...prev, full_name: newName } : prev);
                setIsEditingName(false);
            } catch (err) {
                console.error("Failed to update name", err);
            }
        }
    };

    const handleSaveEmail = async () => {
        const token = localStorage.getItem('token');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!newEmail || !emailPattern.test(newEmail)) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        if (token) {
            try {
                await editEmail(token, newEmail);
                setEmailError('');
                props.setUser(prev => prev ? { ...prev, email: newEmail } : prev);
                setIsEditingEmail(false);
            } catch (err) {
                setEmailError("Email already in use or update failed.");
            }
        }
    };

    if (!user) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Loading profile...</h2>;

    return (
        <div style={containerStyle}>
            <div style={{...baseCardStyle, borderTop: '5px solid #007bff'}}> 
                <div style={titleWrapperStyle}>
                    <UserIcon size={20} color="#007bff" />
                    <h3 style={{...headerStyle, color: '#007bff'}}>Account Details</h3>
                </div>

                <div style={infoRowStyle}>
                    <UserIcon size={16} color="#666" /> 
                    {isEditingName ? (
                        <div style={editContainerStyle}>
                            <input value={newName} onChange={(e) => setNewName(e.target.value)} style={editInputStyle}/>
                            <button onClick={handleSaveName} style={iconSuccessButtonStyle}><Check size={14}/></button>
                            <button onClick={() => setIsEditingName(false)} style={iconCancelButtonStyle}><X size={14}/></button>
                        </div>
                    ) : (
                        <span style={rowContentStyle}>
                            <span><strong>Name:</strong> {user.full_name || 'Not set'}</span>
                            <button onClick={() => setIsEditingName(true)} style={betterEditButtonStyle}>
                                <Edit2 size={12} style={{marginRight: '4px'}}/> Edit
                            </button>
                        </span>
                    )}
                </div>
                
                <div style={infoRowStyle}>
                    <UserIcon size={16} color="#666" />
                    <span><strong>Username:</strong> {user.username}</span>
                </div>

                <div style={infoRowStyle}>
                    <Mail size={16} color="#666" />
                    {isEditingEmail ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={editContainerStyle}>
                                <input 
                                    type="email" 
                                    value={newEmail} 
                                    onChange={(e) => {
                                        setNewEmail(e.target.value);
                                        if (emailError) setEmailError('');
                                    }} 
                                    style={{
                                        ...editInputStyle,
                                        borderColor: emailError ? '#dc3545' : '#ddd'
                                    }}
                                />
                                <button onClick={handleSaveEmail} style={iconSuccessButtonStyle}><Check size={14}/></button>
                                <button onClick={() => {
                                    setIsEditingEmail(false);
                                    setEmailError('');
                                }} style={iconCancelButtonStyle}><X size={14}/></button>
                            </div>
                            {emailError && (
                                <span style={{ color: '#dc3545', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                    {emailError}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span style={rowContentStyle}>
                            <span><strong>Email:</strong> {user.email}</span>
                            <button onClick={() => setIsEditingEmail(true)} style={betterEditButtonStyle}>
                                <Edit2 size={12} style={{marginRight: '4px'}}/> Edit
                            </button>
                        </span>
                    )}
                </div>
            </div>

            <div style={{...baseCardStyle, borderTop: '5px solid black'}}> 
                <div style={titleWrapperStyle}>
                    <Users size={20} color="black" />
                    <h3 style={{...headerStyle, color: 'black'}}>Friends</h3>
                </div>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>No friends added yet.</p>
            </div>

            <style>{` @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
        </div>
    );
}

const betterEditButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    color: '#007bff',
    border: '1px solid #d0e2ff',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const iconSuccessButtonStyle = {
    backgroundColor: '#e6fffa',
    color: '#28a745',
    border: '1px solid #b2f5ea',
    borderRadius: '4px',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
};

const iconCancelButtonStyle = {
    backgroundColor: '#fff5f5',
    color: '#dc3545',
    border: '1px solid #fed7d7',
    borderRadius: '4px',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
};

const editContainerStyle = { display: 'flex', gap: '8px', alignItems: 'center' };
const rowContentStyle = { display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' };

const containerStyle = {
    display: 'flex',
    gap: '24px', 
    padding: '30px',
    flexWrap: 'wrap' as const,
    alignItems: 'flex-start'
};

const baseCardStyle = {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
    minWidth: '300px',
    flex: 1,
    display: 'flex', 
    flexDirection: 'column' as const,
    gap: '12px',
    height: 'fit-content'
};

const titleWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px'
};

const headerStyle = {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: 'bold' as const
};

const infoRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 0',
    color: '#444',
    borderBottom: '1px solid #f9f9f9'
};

const editInputStyle = {
    padding: '5px 8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.9rem',
    outline: 'none',
    width: '150px'
};

export default Profile;