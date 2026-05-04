/**
 * Phone Verification Modal Component
 * Reusable component for phone verification flow
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { sendVerificationCode, verifyCode } from '../../lib/api/phoneVerification';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phoneNumber: string) => void;
  userId?: string;
  initialPhoneNumber?: string;
}

export default function PhoneVerificationModal({
  isOpen,
  onClose,
  onVerified,
  userId,
  initialPhoneNumber = ''
}: PhoneVerificationModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!isCodeSent || !expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.floor((expiry - now) / 1000);

      if (diff <= 0) {
        setTimeLeft(0);
        setIsCodeSent(false);
        toast.error('인증번호가 만료되었습니다. 다시 요청해주세요.');
        clearInterval(interval);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCodeSent, expiresAt]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPhoneNumber(initialPhoneNumber);
      setVerificationCode('');
      setIsCodeSent(false);
      setTimeLeft(180);
      setExpiresAt(null);
    }
  }, [isOpen, initialPhoneNumber]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format: 010-1234-5678
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast.error('핸드폰 번호를 입력해주세요');
      return;
    }

    setIsSending(true);
    try {
      const response = await sendVerificationCode(phoneNumber);
      if (response.success) {
        setIsCodeSent(true);
        setExpiresAt(response.expiresAt);
        toast.success('인증번호가 발송되었습니다');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('인증번호 발송에 실패했습니다');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error('인증번호를 입력해주세요');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyCode(phoneNumber, verificationCode, userId);
      if (response.success && response.phoneNumber) {
        toast.success('인증이 완료되었습니다');
        onVerified(response.phoneNumber);
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('인증에 실패했습니다');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-md w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">핸드폰 인증</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Phone Number Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">
              핸드폰 번호
            </label>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="010-1234-5678"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                maxLength={13}
                disabled={isCodeSent}
                className="flex-1"
              />
              <Button
                onClick={handleSendCode}
                disabled={isSending || isCodeSent || !phoneNumber}
                className="whitespace-nowrap"
              >
                {isSending ? '발송중...' : isCodeSent ? '발송완료' : '인증번호 발송'}
              </Button>
            </div>
          </div>

          {/* Verification Code Input */}
          {isCodeSent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/80">
                  인증번호
                </label>
                <span className="text-sm text-red-600 font-medium">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="6자리 숫자"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="flex-1"
                />
                <Button
                  onClick={handleVerifyCode}
                  disabled={isVerifying || !verificationCode || verificationCode.length !== 6}
                  className="whitespace-nowrap"
                >
                  {isVerifying ? '확인중...' : '인증하기'}
                </Button>
              </div>
            </div>
          )}

          {/* Resend Button */}
          {isCodeSent && timeLeft === 0 && (
            <Button
              onClick={handleSendCode}
              disabled={isSending}
              variant="outline"
              className="w-full"
            >
              인증번호 재발송
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
