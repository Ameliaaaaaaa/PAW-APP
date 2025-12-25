import React, { useState } from 'react';

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';

export default function TwoFAModal({ onClose, onSubmit, isLoading }) {
    const [code, setCode] = useState(['', '', '', '', '', '']);

    const handleSubmit = (event) => {
        event.preventDefault();
        
        onSubmit(code.join(''));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Two-Factor Authentication</h2>
                <p className="mb-4">Please enter the verification code from your authenticator app or email.</p>
                <InputOTP maxLength={6} value={code.join('')} onChange={(value) => setCode(value.split(''))}>
                    <InputOTPGroup>
                        {code.map((digit, index) => (
                            <InputOTPSlot key={index} index={index} />
                        ))}
                    </InputOTPGroup>
                <InputOTPSeparator />
                </InputOTP>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Verifying..." : "Verify"}
                    </Button>
                </div>
            </div>
        </div>
    );
};