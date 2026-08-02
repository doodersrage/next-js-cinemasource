import type { RtsConfig } from '../types';
import { xmlToObject } from './xml';

export function getRtsEndpoint(config: RtsConfig): { host: string; username: string; password: string } {
  if (config.useSandbox) {
    return {
      host: config.sandboxHost,
      username: config.sandboxUsername,
      password: config.sandboxPassword,
    };
  }

  return {
    host: config.host,
    username: config.username,
    password: config.password,
  };
}

export function buildShowTimeXmlRequest(): string {
  return `<?xml version="1.0"?><Request><Version>1</Version><Command>ShowTimeXml</Command><ShowAvalTickets>1</ShowAvalTickets><ShowSales>1</ShowSales><ShowSaleLinks>1</ShowSaleLinks></Request>`;
}

export async function postRtsXml(config: RtsConfig, packet: string): Promise<string> {
  const endpoint = getRtsEndpoint(config);
  const url = `https://${endpoint.host}:${config.port}/Data.ASP`;
  const auth = Buffer.from(`${endpoint.username}:${endpoint.password}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      Authorization: `Basic ${auth}`,
    },
    body: packet,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`RTS request failed (${response.status})`);
  }

  return response.text();
}

export async function postRtsJson<T = Record<string, unknown>>(
  config: RtsConfig,
  packet: string,
): Promise<T> {
  const xml = await postRtsXml(config, packet);
  return xmlToObject<T>(xml);
}
