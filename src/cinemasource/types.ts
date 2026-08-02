export interface CinemaSourceConfig {
  baseUrl: string;
  apiVersion: string;
  apiKey: string;
  houseId: string;
}

export interface RtsConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useSandbox: boolean;
  sandboxHost: string;
  sandboxUsername: string;
  sandboxPassword: string;
  verifySsl: boolean;
}

export interface SiteConfig {
  processCompleteUrl: string;
  returnUrl: string;
  convFee: number;
  trailerBaseUrl: string;
}

export interface CinemaModuleConfig {
  cinemaSource: CinemaSourceConfig;
  rts: RtsConfig;
  site: SiteConfig;
}

export interface ShowtimeEntry {
  '@attributes'?: { date: string };
  showtime?: string;
  showtime_24?: string;
}

export interface ListingMovie {
  movie_id: string;
  movie_name: string;
  movie_rating: string;
  showtimes: ShowtimeEntry | ShowtimeEntry[];
}

export interface MovieDetail {
  movie_id?: string;
  title: string;
  name: string;
  rating: string;
  runtime: string;
  synopsis: string;
  website?: string;
  genres: { genre: string | string[] };
  actors: { actor: string | string[] };
  directors: { director: string | string[] };
  photos: { photo: string };
  hiphotos?: { photo: string | string[] };
}

export interface RtsTicket {
  Code: string;
  Name: string;
  Price: string;
  HideOnInternet: string;
}

export interface RtsShow {
  ID: string;
  DT: string;
  TIs: {
    TI: { C: string } | { C: string }[];
  };
}

export interface RtsFilm {
  CSCode: string;
  Shows: {
    Show: RtsShow | RtsShow[];
  };
}

export interface RtsListing {
  ShowSchedule: {
    Films: {
      Film: RtsFilm | RtsFilm[];
    };
    Tickets: {
      Ticket: RtsTicket | RtsTicket[];
    };
  };
}

export type DateOpts = Record<string, number>;

export interface RtsClientConfig {
  reqUrl: string;
  sessUrl: string;
  redirUrl: string;
  processCompleteUrl: string;
  returnUrl: string;
  convFee: number;
}

export interface CinemaListingPayload {
  dateOpts: DateOpts;
  soonDateOpts: DateOpts;
  listingData: ListingMovie[];
  rtsListingData: RtsListing;
  movieData: Record<string, MovieDetail>;
  rtsConfig: RtsClientConfig;
}

export interface CheckoutSession {
  hostCheckout?: Record<string, unknown>;
  selTime: string;
  movieData: MovieDetail;
  performanceId: string;
  selTicketsQty: { code: string; qty: number }[];
  orderSum: number;
  email: string;
  customerInfo: {
    fullName: string;
    streetAddress: string;
    zipCode: string;
  };
  paymentRes?: {
    PaymentID: string;
    ReturnCode: string;
    ReturnMessage: string;
  };
  rtsResult?: Record<string, unknown>;
}

export interface ShowtimeOption {
  performanceId: string;
  label: string;
  dateTime: string;
}
