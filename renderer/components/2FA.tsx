'use client';

import { useState } from 'react';

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';

export default function TwoFAModal({ onClose, onSubmit, isLoading }: { onClose: () => void; onSubmit: (code: string) => void; isLoading: boolean; }): JSX.Element {
    const [code, setCode] = useState('');

    const handleSubmit: any = (event: React.FormEvent): void => {
        event.preventDefault();
        onSubmit(code);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full space-y-4">
                <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground">
                    Enter the verification code from your authenticator app or email.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || code.length < 6}>
                            {isLoading ? 'Verifying...' : 'Verify'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};