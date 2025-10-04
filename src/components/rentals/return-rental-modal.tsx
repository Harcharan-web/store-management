"use client";

import { useState, useCallback, useEffect, type FC } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import type { RentalWithDetails } from "@/types";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReturnRentalModalProps {
  rental: RentalWithDetails;
  onReturn: (data: ReturnData) => Promise<void>;
  onCancel: () => void;
}

interface ReturnData {
  items: {
    id: string;
    quantityReturned: number;
  }[];
  returnDate: string;
  actualRentalCharges: string;
  returnPaymentMethod: string;
  returnPaymentAmount: string;
  lateFee: string;
  damageCharges: string;
  depositReturned: boolean;
  nextReturnDate?: string;
  returnNotes: string;
}

interface ItemReturn {
  id: string;
  productName: string;
  unit: string;
  totalQuantity: number;
  alreadyReturned: number;
  returningNow: number;
  rateType: string;
  rateAmount: string;
}

const ReturnRentalModal: FC<ReturnRentalModalProps> = ({
  rental,
  onReturn,
  onCancel,
}) => {
  const [itemReturns, setItemReturns] = useState<ItemReturn[]>(
    rental.items.map((item) => ({
      id: item.id,
      productName: item.product.name,
      unit: item.product.unit || "piece",
      totalQuantity: item.quantity,
      alreadyReturned: item.quantityReturned || 0,
      returningNow: Math.max(0, item.quantity - (item.quantityReturned || 0)),
      rateType: item.rateType || "daily",
      rateAmount: item.rateAmount || "0",
    }))
  );

  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [lateFee, setLateFee] = useState("0");
  const [damageCharges, setDamageCharges] = useState("0");
  const [depositReturned, setDepositReturned] = useState(true);
  const [nextReturnDate, setNextReturnDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Calculate actual days used
  const calculateActualDays = useCallback(() => {
    const start = new Date(rental.startDate);
    const end = new Date(returnDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [rental.startDate, returnDate]);

  const calculateExpectedDays = useCallback(() => {
    const start = new Date(rental.startDate);
    const end = new Date(rental.expectedReturnDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [rental.startDate, rental.expectedReturnDate]);

  // Calculate actual rental charges based on actual days used
  const calculateActualCharges = useCallback(() => {
    const actualDays = calculateActualDays();
    const actualWeeks = Math.ceil(actualDays / 7);
    const actualMonths = Math.ceil(actualDays / 30);

    let total = 0;
    itemReturns.forEach((item) => {
      let periodCount = 0;
      if (item.rateType === "daily") periodCount = actualDays;
      else if (item.rateType === "weekly") periodCount = actualWeeks;
      else if (item.rateType === "monthly") periodCount = actualMonths;

      const rate = parseFloat(item.rateAmount) || 0;
      const itemCharge = rate * periodCount * item.totalQuantity;
      total += itemCharge;
    });

    return total;
  }, [itemReturns, calculateActualDays]);

  // Auto-calculate late fee if returned late
  useEffect(() => {
    const expectedDays = calculateExpectedDays();
    const actualDays = calculateActualDays();

    if (actualDays > expectedDays) {
      // Returned late - suggest late fee (can be edited)
      const extraDays = actualDays - expectedDays;
      const suggestedLateFee = extraDays * 100; // ₹100 per day late fee suggestion
      if (lateFee === "0") {
        setLateFee(suggestedLateFee.toString());
      }
    }
  }, [returnDate, calculateActualDays, calculateExpectedDays, lateFee]);

  const handleQuantityChange = useCallback(
    (itemId: string, quantity: number) => {
      setItemReturns((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                returningNow: Math.min(
                  Math.max(0, quantity),
                  item.totalQuantity - item.alreadyReturned
                ),
              }
            : item
        )
      );
    },
    []
  );

  const getTotalReturning = useCallback(() => {
    return itemReturns.reduce((sum, item) => sum + item.returningNow, 0);
  }, [itemReturns]);

  const getTotalRemaining = useCallback(() => {
    return itemReturns.reduce(
      (sum, item) =>
        sum + (item.totalQuantity - item.alreadyReturned - item.returningNow),
      0
    );
  }, [itemReturns]);

  const isPartialReturn = useCallback(() => {
    return getTotalRemaining() > 0;
  }, [getTotalRemaining]);

  const calculateFinalAmount = useCallback(() => {
    const actualCharges = calculateActualCharges();
    const late = Number(lateFee) || 0;
    const damage = Number(damageCharges) || 0;
    const deposit = depositReturned ? (Number(rental.securityDeposit) || 0) : 0;

    return actualCharges + late + damage - deposit;
  }, [calculateActualCharges, lateFee, damageCharges, depositReturned, rental.securityDeposit]);

  const handleSubmit = useCallback(async () => {
    if (!paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    if (isPartialReturn() && !nextReturnDate) {
      alert("Please specify the next return date for remaining items");
      return;
    }

    setSubmitting(true);
    try {
      const finalAmount = calculateFinalAmount();

      const data: ReturnData = {
        items: itemReturns.map((item) => ({
          id: item.id,
          quantityReturned: item.returningNow,
        })),
        returnDate,
        actualRentalCharges: calculateActualCharges().toFixed(2),
        returnPaymentMethod: paymentMethod,
        returnPaymentAmount: finalAmount.toFixed(2),
        lateFee,
        damageCharges,
        depositReturned,
        nextReturnDate: isPartialReturn() ? nextReturnDate : undefined,
        returnNotes: notes,
      };

      await onReturn(data);
    } catch (err) {
      console.error("Return error:", err);
    } finally {
      setSubmitting(false);
    }
  }, [
    itemReturns,
    returnDate,
    paymentMethod,
    lateFee,
    damageCharges,
    depositReturned,
    nextReturnDate,
    notes,
    isPartialReturn,
    onReturn,
    calculateActualCharges,
    calculateFinalAmount,
  ]);

  const actualDays = calculateActualDays();
  const expectedDays = calculateExpectedDays();
  const isLate = actualDays > expectedDays;
  const isEarly = actualDays < expectedDays;
  const actualCharges = calculateActualCharges();
  const originalCharges = Number(rental.totalCharges) || 0;
  const finalAmount = calculateFinalAmount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Return Rental</h2>
          <p className="text-sm text-gray-600 mt-1">
            Rental #{rental.rentalNumber} - {rental.customer.name}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Rental Period Comparison */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Rental Period Analysis</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">Expected Duration</p>
                <p className="text-xl font-bold text-gray-900">{expectedDays} days</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(rental.startDate)} to {formatDate(rental.expectedReturnDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Actual Duration</p>
                <p className={`text-xl font-bold ${isLate ? 'text-red-600' : isEarly ? 'text-green-600' : 'text-gray-900'}`}>
                  {actualDays} days
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(rental.startDate)} to {formatDate(returnDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Difference</p>
                <p className={`text-xl font-bold ${isLate ? 'text-red-600' : isEarly ? 'text-green-600' : 'text-gray-900'}`}>
                  {isLate ? '+' : isEarly ? '-' : ''}{Math.abs(actualDays - expectedDays)} days
                </p>
                <p className={`text-xs font-medium mt-1 ${isLate ? 'text-red-600' : isEarly ? 'text-green-600' : 'text-gray-600'}`}>
                  {isLate ? '⚠️ Late Return' : isEarly ? '✓ Early Return' : '✓ On Time'}
                </p>
              </div>
            </div>
          </div>

          {/* Return Date */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Return Date *"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={rental.startDate}
            />
            {isPartialReturn() && (
              <Input
                label="Next Return Date *"
                type="date"
                value={nextReturnDate}
                onChange={(e) => setNextReturnDate(e.target.value)}
                min={returnDate}
              />
            )}
          </div>

          {/* Items Return */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Return Items</h3>
            <div className="space-y-3">
              {itemReturns.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.productName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total: {item.totalQuantity} {item.unit} | Already
                        Returned: {item.alreadyReturned} {item.unit} |
                        Remaining: {item.totalQuantity - item.alreadyReturned}{" "}
                        {item.unit}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {formatCurrency(item.rateAmount)}/{item.rateType}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Input
                        label={`Return Quantity (${item.unit})`}
                        type="number"
                        min={0}
                        max={item.totalQuantity - item.alreadyReturned}
                        value={item.returningNow}
                        onChange={(e) =>
                          handleQuantityChange(item.id, Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="text-sm text-gray-600 pb-3">
                      {item.returningNow > 0 ? (
                        <span className="text-green-600 font-medium">
                          ✓ Returning {item.returningNow} {item.unit}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not returning</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getTotalReturning() > 0 && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800">
                  Total Returning: {getTotalReturning()} items
                  {getTotalRemaining() > 0 && (
                    <span className="ml-2 text-yellow-600">
                      ({getTotalRemaining()} items remaining)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Charges Calculation */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Calculate Final Amount</h3>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Original Estimated Charges ({expectedDays} days)</span>
                  <span className="text-sm line-through text-gray-400">{formatCurrency(originalCharges)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Actual Rental Charges ({actualDays} days)</span>
                    {isEarly && <p className="text-xs text-green-600">Charged for actual days only</p>}
                  </div>
                  <span className={`text-lg font-bold ${actualCharges < originalCharges ? 'text-green-600' : actualCharges > originalCharges ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(actualCharges)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label="Late Fee (if any)"
                type="number"
                step="0.01"
                value={lateFee}
                onChange={(e) => setLateFee(e.target.value)}
                placeholder="0.00"
              />
              <Input
                label="Damage Charges (if any)"
                type="number"
                step="0.01"
                value={damageCharges}
                onChange={(e) => setDamageCharges(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="depositReturned"
                    checked={depositReturned}
                    onChange={(e) => setDepositReturned(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="depositReturned" className="text-sm font-medium text-gray-900">
                    Return Security Deposit
                  </label>
                </div>
                <span className="text-lg font-semibold text-green-600">
                  {depositReturned ? '-' : ''}{formatCurrency(rental.securityDeposit ?? 0)}
                </span>
              </div>
            </div>

            {/* Final Amount Breakdown */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg p-5">
              <h4 className="font-semibold text-gray-900 mb-3">Final Settlement</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Actual Rental Charges:</span>
                  <span className="font-medium">{formatCurrency(actualCharges)}</span>
                </div>
                {Number(lateFee) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Late Fee:</span>
                    <span className="font-medium">+{formatCurrency(lateFee)}</span>
                  </div>
                )}
                {Number(damageCharges) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Damage Charges:</span>
                    <span className="font-medium">+{formatCurrency(damageCharges)}</span>
                  </div>
                )}
                {depositReturned && (
                  <div className="flex justify-between text-green-600">
                    <span>Security Deposit Returned:</span>
                    <span className="font-medium">-{formatCurrency(rental.securityDeposit ?? 0)}</span>
                  </div>
                )}
                <div className="border-t-2 border-blue-300 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">
                      {finalAmount >= 0 ? 'Customer Pays:' : 'Refund to Customer:'}
                    </span>
                    <span className={`text-2xl font-bold ${finalAmount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {finalAmount >= 0 ? formatCurrency(finalAmount) : formatCurrency(Math.abs(finalAmount))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <Select
                label="Payment Method *"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: "", label: "Select payment method" },
                  ...PAYMENT_METHODS.map((method) => ({
                    value: method.value,
                    label: method.label,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Notes */}
          <Textarea
            label="Return Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about the return, condition of items, etc."
            rows={3}
          />
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-4">
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Processing..." : `Process Return - ${finalAmount >= 0 ? 'Collect' : 'Refund'} ${formatCurrency(Math.abs(finalAmount))}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReturnRentalModal;
