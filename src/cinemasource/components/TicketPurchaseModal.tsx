'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeList } from '../lib/normalize';
import type {
  CheckoutSession,
  MovieDetail,
  RtsClientConfig,
  RtsListing,
  RtsShow,
  RtsTicket,
} from '../types';

type Step = 'loading' | 'tickets' | 'review' | 'result';

interface TicketPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  movieId: string;
  performanceId: string;
  selTime: string;
  movieData: Record<string, MovieDetail>;
  rtsListing: RtsListing;
  rtsConfig: RtsClientConfig;
  showPaymentResult?: boolean;
}

export function TicketPurchaseModal({
  open,
  onClose,
  movieId,
  performanceId,
  selTime,
  movieData,
  rtsListing,
  rtsConfig,
  showPaymentResult = false,
}: TicketPurchaseModalProps) {
  const movie = movieData[movieId];
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<RtsTicket[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [canRetry, setCanRetry] = useState(false);

  const ticketOptions = useMemo(
    () => buildTicketOptions(rtsListing, performanceId, movieId),
    [movieId, performanceId, rtsListing],
  );

  const resetForm = useCallback(() => {
    setStep('loading');
    setError(null);
    setSelectedTickets([]);
    setQuantities({});
    setEmail('');
    setEmailConfirm('');
    setFullName('');
    setStreetAddress('');
    setZipCode('');
    setResultMessage('');
    setCanRetry(false);
  }, []);

  useEffect(() => {
    if (!open || showPaymentResult) {
      if (!open) {
        resetForm();
      }
      return;
    }

    async function loadAvailability() {
      setStep('loading');
      setError(null);

      const req = `<Request><Version>1</Version><Command>CheckSoldOut</Command><Data><Packet><PerformanceId>${performanceId}</PerformanceId></Packet></Data></Request>`;

      try {
        const response = await fetch(rtsConfig.reqUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ req }),
        });
        const data = await response.json();
        const maxSales = Number(data.TotalSeats) === 0 ? 64 : Number(data.TotalSeats);
        const sold = Number(data.Sold ?? 0);

        if (sold >= maxSales) {
          setError('Sorry! No tickets available at this time!');
          setStep('result');
          return;
        }

        setSelectedTickets(ticketOptions);
        setQuantities(Object.fromEntries(ticketOptions.map((ticket) => [ticket.Code, 0])));
        setStep('tickets');
      } catch {
        setError('Unable to check ticket availability.');
        setStep('result');
      }
    }

    loadAvailability();
  }, [open, performanceId, resetForm, rtsConfig.reqUrl, showPaymentResult, ticketOptions]);

  const loadPaymentResult = useCallback(async () => {
    const response = await fetch(rtsConfig.sessUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'get' }),
    });
    const res = (await response.json()) as CheckoutSession | null;
    if (!res) {
      return;
    }

    const respCode =
      (res.rtsResult as { Packet?: { Response?: { Code?: number } } })?.Packet?.Response?.Code ??
      (res.rtsResult as { Code?: number })?.Code ??
      -1;

    const message =
      (res.rtsResult as { ErrorText?: string })?.ErrorText ??
      res.paymentRes?.ReturnMessage ??
      (Number(respCode) === 0
        ? 'Your receipt has been emailed. Please print or have your email available on mobile device upon arrival.'
        : 'Payment processed.');

    setResultMessage(message);
    setCanRetry(Number(respCode) !== 0);
    setStep('result');
  }, [rtsConfig.sessUrl]);

  useEffect(() => {
    if (showPaymentResult) {
      loadPaymentResult();
    }
  }, [loadPaymentResult, showPaymentResult]);

  const orderTotal = useMemo(() => {
    return selectedTickets.reduce((sum, ticket) => {
      const qty = quantities[ticket.Code] ?? 0;
      return sum + (Number(ticket.Price) + rtsConfig.convFee) * qty;
    }, 0);
  }, [quantities, rtsConfig.convFee, selectedTickets]);

  async function submitOrder(existing?: CheckoutSession) {
    setError(null);

    const payloadTickets = selectedTickets
      .map((ticket) => ({ code: ticket.Code, qty: quantities[ticket.Code] ?? 0 }))
      .filter((ticket) => ticket.qty > 0);

    const checkoutEmail = existing?.email ?? email;
    const checkoutName = existing?.customerInfo.fullName ?? fullName;
    const checkoutAddress = existing?.customerInfo.streetAddress ?? streetAddress;
    const checkoutZip = existing?.customerInfo.zipCode ?? zipCode;

    if (!validateEmail(checkoutEmail) || checkoutEmail !== (existing ? checkoutEmail : emailConfirm)) {
      setError('Please enter matching valid email addresses.');
      return;
    }

    if (!checkoutName || !checkoutAddress || checkoutZip.length <= 4) {
      setError('All customer fields are required.');
      return;
    }

    if (payloadTickets.length === 0 || orderTotal <= 0) {
      setError('Select at least one ticket.');
      return;
    }

    const hcp = `<Request><Version>1</Version><Command>CreatePayment</Command><Data><Packet><ChargeAmount>${orderTotal.toFixed(2)}</ChargeAmount><StreetAddress>${escapeXml(checkoutAddress)}</StreetAddress><ZipCode>${escapeXml(checkoutZip)}</ZipCode><CustomerName>${escapeXml(checkoutName)}</CustomerName><ProcessCompleteUrl>${encodeURI(rtsConfig.processCompleteUrl)}</ProcessCompleteUrl><ReturnUrl>${encodeURI(rtsConfig.returnUrl)}</ReturnUrl></Packet></Data></Request>`;

    const response = await fetch(rtsConfig.reqUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ req: hcp }),
    });
    const res = await response.json();

    if (res?.Packet?.CreatePayment?.Worked != 1) {
      setError('Payment initialization failed.');
      setStep('result');
      return;
    }

    const order: CheckoutSession = {
      hostCheckout: res,
      selTime,
      movieData: movie,
      performanceId,
      selTicketsQty: payloadTickets,
      orderSum: orderTotal,
      email: checkoutEmail,
      customerInfo: {
        fullName: checkoutName,
        streetAddress: checkoutAddress,
        zipCode: checkoutZip,
      },
    };

    await fetch(rtsConfig.sessUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'set', data: order }),
    });

    const redirect =
      `${rtsConfig.redirUrl}?RedirectUrl=${encodeURIComponent(res.Packet.CreatePayment.RedirectUrl)}` +
      `&paymentID=${encodeURIComponent(res.Packet.CreatePayment.PostData)}` +
      `&TransactionId=${encodeURIComponent(res.Packet.CreatePayment.TransactionId)}`;

    window.location.href = redirect;
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-1/2 top-10 w-[min(720px,calc(100%-2rem))] -translate-x-1/2 rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Buy Movie Tickets</h2>
          <button type="button" className="text-zinc-500" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {step === 'loading' && <p className="text-center">Checking availability...</p>}

          {step === 'tickets' && movie && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={movie.photos.photo} alt={movie.title} className="mb-3 w-full max-w-[220px]" />
                <h3 className="font-semibold">{movie.title}</h3>
                <p className="text-sm">Rated: {movie.rating}</p>
                <p className="text-sm">Runtime: {movie.runtime} minutes</p>
              </div>
              <div>
                <h3 className="mb-3 font-semibold">{selTime}</h3>
                {selectedTickets.map((ticket) => (
                  <div key={ticket.Code} className="mb-3 flex items-center gap-3">
                    <select
                      className="rounded border px-2 py-1"
                      value={quantities[ticket.Code] ?? 0}
                      onChange={(event) =>
                        setQuantities((current) => ({
                          ...current,
                          [ticket.Code]: Number(event.target.value),
                        }))
                      }
                    >
                      {Array.from({ length: 11 }, (_, index) => (
                        <option key={index} value={index}>
                          {index}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm">
                      {formatTicketName(ticket.Name)} @ ${Number(ticket.Price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'review' && movie && (
            <div className="space-y-3">
              <p className="text-sm text-[#ca0012]">
                There is a ${rtsConfig.convFee.toFixed(2)} online convenience fee per ticket
              </p>
              {selectedTickets.map((ticket) => {
                const qty = quantities[ticket.Code] ?? 0;
                if (qty <= 0) {
                  return null;
                }
                const line = (Number(ticket.Price) + rtsConfig.convFee) * qty;
                return (
                  <p key={ticket.Code} className="text-sm">
                    {formatTicketName(ticket.Name)} x {qty} = ${line.toFixed(2)}
                  </p>
                );
              })}
              <p className="font-semibold">Total: ${orderTotal.toFixed(2)}</p>
              <input className="w-full rounded border px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="w-full rounded border px-3 py-2" placeholder="Confirm email" value={emailConfirm} onChange={(e) => setEmailConfirm(e.target.value)} />
              <input className="w-full rounded border px-3 py-2" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input className="w-full rounded border px-3 py-2" placeholder="Street address" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
              <input className="w-full rounded border px-3 py-2" placeholder="Zip or postal code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
            </div>
          )}

          {step === 'result' && (
            <div>
              {error && <p className="text-red-600">{error}</p>}
              {resultMessage && <p>{resultMessage}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button type="button" className="rounded border px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          {step === 'tickets' && (
            <button
              type="button"
              className="rounded bg-[#ca0012] px-4 py-2 text-white"
              onClick={() => {
                if (orderTotal > 0) {
                  setStep('review');
                } else {
                  setError('Select at least one ticket.');
                }
              }}
            >
              Continue
            </button>
          )}
          {step === 'review' && (
            <button type="button" className="rounded bg-[#ca0012] px-4 py-2 text-white" onClick={() => submitOrder()}>
              Continue
            </button>
          )}
          {step === 'result' && canRetry && (
            <button type="button" className="rounded bg-[#ca0012] px-4 py-2 text-white" onClick={() => submitOrder()}>
              Try Again?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function buildTicketOptions(
  rtsListing: RtsListing,
  performanceId: string,
  movieId: string,
): RtsTicket[] {
  const tickets = normalizeList(rtsListing.ShowSchedule?.Tickets?.Ticket);
  const films = normalizeList(rtsListing.ShowSchedule?.Films?.Film);
  const film = films.find((entry) => String(entry.CSCode) === String(movieId));
  if (!film) {
    return [];
  }

  const shows = normalizeList(film.Shows?.Show) as RtsShow[];
  const show =
    shows.find((entry) => String(entry.ID) === String(performanceId)) ??
    (!Array.isArray(film.Shows?.Show) ? (film.Shows?.Show as RtsShow) : undefined);

  if (!show) {
    return [];
  }

  const showTicketCodes = normalizeList(show.TIs?.TI).map((ti) => ti.C);
  return tickets.filter(
    (ticket) => showTicketCodes.includes(ticket.Code) && Number(ticket.HideOnInternet) !== 1,
  );
}

function formatTicketName(name: string): string {
  return name.charAt(0) === 'e' ? name.slice(1) : name;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
