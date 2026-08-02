import { NextResponse } from 'next/server';
import { getCinemaConfig } from '@/cinemasource/config';
import { postRtsXml } from '@/cinemasource/lib/rtsClient';
import { getCheckoutSession } from '@/cinemasource/lib/session';
import { xmlToObject } from '@/cinemasource/lib/xml';

export async function POST(request: Request) {
  const form = await request.formData();
  const session = await getCheckoutSession();
  const checkout = session.checkout;

  if (!checkout) {
    return new NextResponse('No session data found', { status: 400 });
  }

  checkout.paymentRes = {
    PaymentID: String(form.get('PaymentID') ?? ''),
    ReturnCode: String(form.get('ReturnCode') ?? ''),
    ReturnMessage: String(form.get('ReturnMessage') ?? ''),
  };

  const config = getCinemaConfig();
  const convFee = config.site.convFee;
  let ticketSum = 0;

  let ticketsXml = '';
  for (const ticket of checkout.selTicketsQty) {
    ticketsXml += `<Ticket><Amount>${ticket.qty}</Amount><TypeCode>${escapeXml(ticket.code)}</TypeCode></Ticket>`;
    ticketSum += ticket.qty;
  }

  const transactionId =
    (checkout.hostCheckout as { Packet?: { CreatePayment?: { TransactionId?: string } } })
      ?.Packet?.CreatePayment?.TransactionId ?? '';

  const paymentId = checkout.paymentRes.PaymentID;
  const returnCode = checkout.paymentRes.ReturnCode;
  const returnMessage = encodeURIComponent(checkout.paymentRes.ReturnMessage);
  const chargeAmount = Number(checkout.orderSum).toFixed(2);
  const ticketFee = (ticketSum * convFee).toFixed(2);

  const packet = `<?xml version="1.0"?><Request><Version>1</Version><Command>Buy</Command><Data><Packet><PurchaseTitles><PurchaseTitle><PerformanceID>${escapeXml(checkout.performanceId)}</PerformanceID><Tickets>${ticketsXml}</Tickets></PurchaseTitle></PurchaseTitles><Fees><TicketFee>${ticketFee}</TicketFee><TransactionFee>0</TransactionFee><Adjust>0</Adjust></Fees><Payments><Payment><Type>CreditCard</Type><TransactionId>${escapeXml(transactionId)}</TransactionId><ProcessCompletePostData>PaymentID=${paymentId}&amp;ReturnCode=${returnCode}&amp;ReturnMessage=${returnMessage}</ProcessCompletePostData><ChargeAmount>${chargeAmount}</ChargeAmount></Payment></Payments><CustomerInfo><EmailAddress>${escapeXml(checkout.email)}</EmailAddress></CustomerInfo></Packet></Data></Request>`;

  const xml = await postRtsXml(config.rts, packet);
  checkout.rtsResult = xmlToObject(xml);
  session.checkout = checkout;
  await session.save();

  const returnUrl = config.site.returnUrl || '/showtimes?paymentRes=1';
  return NextResponse.redirect(returnUrl, 303);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
