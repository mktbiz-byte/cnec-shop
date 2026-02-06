'use client';

import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home, HelpCircle } from 'lucide-react';

const errorMessages: Record<string, string> = {
  PAY_PROCESS_CANCELED: 'Payment was cancelled by user',
  PAY_PROCESS_ABORTED: 'Payment was aborted',
  REJECT_CARD_COMPANY: 'Card was rejected by the issuing bank',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: 'Daily payment limit exceeded',
  EXCEED_MAX_PAYMENT_AMOUNT: 'Maximum payment amount exceeded',
  INVALID_CARD_EXPIRATION: 'Card has expired',
  INVALID_STOPPED_CARD: 'Card has been stopped',
  INVALID_CARD_LOST: 'Card reported as lost',
  INVALID_CARD_NUMBER: 'Invalid card number',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: 'Installment not supported',
  INVALID_CARD_ISSUER: 'Invalid card issuer',
  DUPLICATED_PAYMENT: 'Duplicate payment detected',
  NOT_AVAILABLE_PAYMENT: 'Payment method not available',
};

export default function PaymentFailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const code = searchParams.get('code') || 'UNKNOWN_ERROR';
  const message = searchParams.get('message') || errorMessages[code] || 'Payment failed';
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center pb-2">
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-muted-foreground">{message}</p>
            {code && code !== 'UNKNOWN_ERROR' && (
              <p className="font-mono text-xs text-muted-foreground mt-2">
                Error code: {code}
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
            <p className="font-medium mb-2">Possible reasons:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Insufficient funds</li>
              <li>Card expired or blocked</li>
              <li>Payment cancelled</li>
              <li>Network connection issue</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full gap-2"
              onClick={() => window.history.back()}
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href={'/' + locale}>
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" />
                Return Home
              </Button>
            </Link>
            <Link href={'/' + locale + '/support'}>
              <Button variant="ghost" className="w-full gap-2">
                <HelpCircle className="h-4 w-4" />
                Contact Support
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
