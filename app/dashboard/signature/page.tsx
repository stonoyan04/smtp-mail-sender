'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { env } from '@/lib/env';

export default function SignaturePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signatureHtml, setSignatureHtml] = useState('');
  const [signatureEnabled, setSignatureEnabled] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch current signature
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const fetchSignature = async () => {
      try {
        const response = await fetch('/api/users/signature');
        if (!response.ok) {
          throw new Error('Failed to fetch signature');
        }
        const result = await response.json();
        setSignatureHtml(result.data.signatureHtml || '');
        setSignatureEnabled(result.data.signatureEnabled);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSignature();
  }, [status]);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/signature', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureHtml,
          signatureEnabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save signature');
      }

      setSuccess('Signature saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signatureTemplates = [
    {
      name: 'Professional',
      html: `<div style="font-family: Arial, sans-serif; color: #333;">
  <p style="margin: 0;">Best regards,</p>
  <p style="margin: 5px 0;"><strong>Your Name</strong></p>
  <p style="margin: 0; font-size: 14px; color: #666;">Your Title</p>
  <p style="margin: 0; font-size: 14px; color: #666;">Your Company</p>
  <p style="margin: 5px 0; font-size: 14px;">
    <a href="mailto:your@${env.domain}" style="color: #0066cc; text-decoration: none;">your@${env.domain}</a> |
    <a href="tel:+1234567890" style="color: #0066cc; text-decoration: none;">+1 234 567 8900</a>
  </p>
</div>`,
    },
    {
      name: 'Simple',
      html: `<div style="font-family: Arial, sans-serif; color: #333;">
  <p style="margin: 0;">Thanks,</p>
  <p style="margin: 5px 0;"><strong>Your Name</strong></p>
</div>`,
    },
    {
      name: 'Detailed',
      html: `<div style="font-family: Arial, sans-serif; color: #333; border-top: 2px solid #0066cc; padding-top: 10px;">
  <p style="margin: 0;"><strong>Your Name</strong></p>
  <p style="margin: 5px 0; color: #666;">Your Title | Your Company</p>
  <p style="margin: 10px 0; font-size: 14px;">
    <strong>Email:</strong> <a href="mailto:your@${env.domain}" style="color: #0066cc; text-decoration: none;">your@${env.domain}</a><br>
    <strong>Phone:</strong> <a href="tel:+1234567890" style="color: #0066cc; text-decoration: none;">+1 234 567 8900</a><br>
    <strong>Website:</strong> <a href="https://www.${env.domain}" style="color: #0066cc; text-decoration: none;">www.${env.domain}</a>
  </p>
</div>`,
    },
  ];

  if (status === 'loading' || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading signature settings...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout userEmail={session.user.email} userRole={session.user.role}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Email Signature</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">Enable Signature</h3>
              <p className="text-sm text-gray-600">
                Automatically append your signature to all outgoing emails
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={signatureEnabled}
                onChange={(e) => setSignatureEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Signature Templates */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Signature Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {signatureTemplates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => setSignatureHtml(template.html)}
                  className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <p className="font-medium text-gray-900 mb-2">{template.name}</p>
                  <p className="text-xs text-gray-500">Click to use this template</p>
                </button>
              ))}
            </div>
          </div>

          {/* Signature Editor */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              Signature HTML
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Edit your signature using HTML. You can customize the template or write your own.
            </p>
            <textarea
              value={signatureHtml}
              onChange={(e) => setSignatureHtml(e.target.value)}
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter your signature HTML here..."
            />
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Preview</h3>
            <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 min-h-[150px]">
              {signatureHtml ? (
                <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
              ) : (
                <p className="text-gray-400 italic">Your signature preview will appear here</p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              isLoading={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Signature
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
