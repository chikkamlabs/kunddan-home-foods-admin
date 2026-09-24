'use client';

import { useState } from 'react';
import { createCustomer, generateCustomerKey } from '@/lib/customersStore';
import { X, Loader2, AlertCircle, User, Phone, Mail, MapPin, Award, Tag, KeyRound } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCustomerModalProps) {
  if (!isOpen) return null;

  return <AddCustomerModalContent onClose={onClose} onSuccess={onSuccess} />;
}

function AddCustomerModalContent({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [referralCode, setReferralCode] = useState('');
  const [customerKey, setCustomerKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateKey = () => {
    setCustomerKey(generateCustomerKey(mobileNumber));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedMobile = mobileNumber.trim();

    if (!trimmedName) {
      setError('Customer name is required.');
      return;
    }

    if (!trimmedMobile) {
      setError('Mobile number is required.');
      return;
    }

    setLoading(true);

    try {
      const finalKey = customerKey.trim() || generateCustomerKey(trimmedMobile);

      const { error: insertError } = await createCustomer({
        name: trimmedName,
        mobile_number: trimmedMobile,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        city_code: cityCode.trim() || null,
        loyalty_points: Number(loyaltyPoints) || 0,
        referral_code: referralCode.trim() || null,
        key: finalKey,
      });

      if (insertError) {
        throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error creating customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to add customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="add-customer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="add-customer-modal"
        className="ui-card w-full max-w-2xl overflow-hidden p-0 shadow-2xl my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-customer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="brand-icon-box">
              <User className="h-5 w-5 text-neutral-800" />
            </div>
            <div>
              <h2
                id="add-customer-title"
                className="text-lg font-bold text-neutral-900"
              >
                Add New Customer
              </h2>
              <p className="text-xs text-neutral-500">
                Create a new customer profile and loyalty account
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-add-customer-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="ui-alert-error">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="cust-name">
                <User className="h-3.5 w-3.5 text-neutral-500" />
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                id="cust-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="form-input text-sm"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="cust-mobile">
                <Phone className="h-3.5 w-3.5 text-neutral-500" />
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                id="cust-mobile"
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="form-input text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="cust-email">
                <Mail className="h-3.5 w-3.5 text-neutral-500" />
                Email Address
              </label>
              <input
                id="cust-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@example.com"
                className="form-input text-sm"
              />
            </div>

            {/* Loyalty Points */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="cust-points">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                Loyalty Points
              </label>
              <input
                id="cust-points"
                type="number"
                min="0"
                step="1"
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
                placeholder="0"
                className="form-input text-sm"
              />
            </div>

            {/* Referral Code */}
            <div>
              <label className="form-label flex items-center gap-1.5" htmlFor="cust-referral">
                <Tag className="h-3.5 w-3.5 text-neutral-500" />
                Referral Code
              </label>
              <input
                id="cust-referral"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="e.g. REF123"
                className="form-input text-sm"
              />
            </div>

            {/* Customer Tracking Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label flex items-center gap-1.5 mb-0" htmlFor="cust-key">
                  <KeyRound className="h-3.5 w-3.5 text-neutral-500" />
                  Key (Unique)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateKey}
                  className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 underline"
                >
                  Generate Key
                </button>
              </div>
              <input
                id="cust-key"
                type="text"
                value={customerKey}
                onChange={(e) => setCustomerKey(e.target.value)}
                placeholder="Auto-generated if left empty"
                className="form-input text-sm font-mono"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="form-label flex items-center gap-1.5" htmlFor="cust-address">
              <MapPin className="h-3.5 w-3.5 text-neutral-500" />
              Address
            </label>
            <textarea
              id="cust-address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Door No, Street Name, Area..."
              className="form-input text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* City */}
            <div>
              <label className="form-label" htmlFor="cust-city">
                City
              </label>
              <input
                id="cust-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="form-input text-sm"
              />
            </div>

            {/* City Code */}
            <div>
              <label className="form-label" htmlFor="cust-city-code">
                City / Postal Code
              </label>
              <input
                id="cust-city-code"
                type="text"
                value={cityCode}
                onChange={(e) => setCityCode(e.target.value)}
                placeholder="e.g. 500081"
                className="form-input text-sm"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              id="cancel-add-customer-btn"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-add-customer-btn"
              disabled={loading}
              className="btn-primary text-xs px-5 py-2 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{loading ? 'Creating...' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
