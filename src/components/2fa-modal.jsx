import React, { useState } from 'react';

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';

export default function TwoFAModal({ onClose, onSubmit }) {
    const [code, setCode] = useState(['', '', '', '', '', '']);

    const handleSubmit = (event) => {
        event.preventDefault();
        
        onSubmit(code.join(''));
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Two-Factor Authentication</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="2fa-code">Enter your 2FA code:</label>
                    <InputOTP maxLength={6} value={code.join('')} onChange={(value) => setCode(value.split(''))}>
                        <InputOTPGroup>
                            {code.map((digit, index) => (
                                <InputOTPSlot key={index} index={index} />
                            ))}
                        </InputOTPGroup>
                        <InputOTPSeparator />
                    </InputOTP>
                    <button type="submit">Submit</button>
                </form>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};